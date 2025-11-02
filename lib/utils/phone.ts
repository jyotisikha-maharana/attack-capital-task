/**
 * Phone number normalization utilities
 * Converts phone numbers to E.164 format for consistent storage
 */

/**
 * Normalize phone number to E.164 format
 * Basic implementation - in production, consider using a library like libphonenumber-js
 * 
 * @param phone - Raw phone number string
 * @returns E.164 formatted phone number (e.g., +1234567890)
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Remove common prefixes like "whatsapp:"
  cleaned = cleaned.replace(/^whatsapp:/i, '');
  
  // If it starts with a country code (e.g., +1), keep it
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  // If it's a US number without country code, add +1
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  // If it's 11 digits and starts with 1 (US country code), add +
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  
  // Otherwise, assume it needs a + prefix
  return `+${cleaned}`;
}

/**
 * Determine channel type from Twilio webhook payload
 * 
 * @param from - The "From" number in the webhook
 * @param to - The "To" number in the webhook
 * @returns Channel type (SMS or WHATSAPP)
 */
export function determineChannel(from: string, to: string): 'SMS' | 'WHATSAPP' {
  // WhatsApp messages typically come from numbers starting with "whatsapp:"
  if (from.toLowerCase().startsWith('whatsapp:') || to.toLowerCase().startsWith('whatsapp:')) {
    return 'WHATSAPP';
  }
  return 'SMS';
}

