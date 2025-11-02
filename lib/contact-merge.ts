/**
 * Contact Auto-Merge and Duplicate Detection
 * Uses fuzzy matching to identify and merge duplicate contacts
 */

import { prisma } from './prisma';
import { normalizePhoneNumber } from './utils/phone';

interface ContactSimilarity {
  contact1Id: string;
  contact2Id: string;
  similarity: number;
  reason: string;
}

/**
 * Calculate similarity between two strings (Levenshtein-based)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Find potential duplicate contacts
 */
export async function findDuplicateContacts(threshold = 0.8): Promise<ContactSimilarity[]> {
  const contacts = await prisma.contact.findMany({
    include: {
      messages: {
        select: {
          id: true,
        },
      },
    },
  });

  const duplicates: ContactSimilarity[] = [];

  for (let i = 0; i < contacts.length; i++) {
    for (let j = i + 1; j < contacts.length; j++) {
      const contact1 = contacts[i];
      const contact2 = contacts[j];

      let similarity = 0;
      let reason = '';

      // Check phone numbers (normalized)
      if (contact1.phoneNumber && contact2.phoneNumber) {
        const phone1 = normalizePhoneNumber(contact1.phoneNumber);
        const phone2 = normalizePhoneNumber(contact2.phoneNumber);
        if (phone1 === phone2) {
          similarity = 1.0;
          reason = 'Same phone number';
        }
      }

      // Check emails
      if (similarity < 1.0 && contact1.email && contact2.email) {
        const email1 = contact1.email.toLowerCase().trim();
        const email2 = contact2.email.toLowerCase().trim();
        if (email1 === email2) {
          similarity = 1.0;
          reason = 'Same email';
        } else {
          const sim = calculateSimilarity(email1, email2);
          if (sim > similarity) {
            similarity = sim;
            reason = `Similar email (${Math.round(sim * 100)}%)`;
          }
        }
      }

      // Check names
      if (similarity < 1.0 && contact1.name && contact2.name) {
        const name1 = contact1.name.toLowerCase().trim();
        const name2 = contact2.name.toLowerCase().trim();
        const sim = calculateSimilarity(name1, name2);
        if (sim > similarity) {
          similarity = sim;
          reason = `Similar name (${Math.round(sim * 100)}%)`;
        }
      }

      if (similarity >= threshold) {
        duplicates.push({
          contact1Id: contact1.id,
          contact2Id: contact2.id,
          similarity,
          reason,
        });
      }
    }
  }

  return duplicates;
}

/**
 * Merge two contacts (merge contact2 into contact1)
 */
export async function mergeContacts(
  contact1Id: string,
  contact2Id: string
): Promise<void> {
  const contact1 = await prisma.contact.findUnique({
    where: { id: contact1Id },
  });
  const contact2 = await prisma.contact.findUnique({
    where: { id: contact2Id },
  });

  if (!contact1 || !contact2) {
    throw new Error('One or both contacts not found');
  }

  // Merge data (contact1 takes precedence, but fill in missing fields)
  const mergedData: any = {};

  if (!contact1.name && contact2.name) mergedData.name = contact2.name;
  if (!contact1.phoneNumber && contact2.phoneNumber)
    mergedData.phoneNumber = contact2.phoneNumber;
  if (!contact1.email && contact2.email) mergedData.email = contact2.email;
  if (!contact1.twitterHandle && contact2.twitterHandle)
    mergedData.twitterHandle = contact2.twitterHandle;
  if (!contact1.facebookId && contact2.facebookId)
    mergedData.facebookId = contact2.facebookId;

  // Merge tags
  const allTags = [
    ...(contact1.tags || []),
    ...(contact2.tags || []),
  ];
  mergedData.tags = [...new Set(allTags)];

  // Update contact1 with merged data
  await prisma.contact.update({
    where: { id: contact1Id },
    data: mergedData,
  });

  // Move all messages from contact2 to contact1
  await prisma.message.updateMany({
    where: { contactId: contact2Id },
    data: { contactId: contact1Id },
  });

  // Move all notes from contact2 to contact1
  await prisma.noteThread.updateMany({
    where: { contactId: contact2Id },
    data: { contactId: contact1Id },
  });

  // Move scheduled messages
  await prisma.scheduledMessage.updateMany({
    where: { contactId: contact2Id },
    data: { contactId: contact1Id },
  });

  // Delete contact2
  await prisma.contact.delete({
    where: { id: contact2Id },
  });
}

