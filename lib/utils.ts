/**
 * Utility functions
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  // Remove + and format US numbers
  const cleaned = phone.replace(/[^\d]/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

/**
 * Get channel badge color
 */
export function getChannelColor(channel: string): string {
  switch (channel) {
    case 'SMS':
      return 'bg-blue-100 text-blue-800';
    case 'WHATSAPP':
      return 'bg-green-100 text-green-800';
    case 'EMAIL':
      return 'bg-purple-100 text-purple-800';
    case 'TWITTER':
      return 'bg-sky-100 text-sky-800';
    case 'FACEBOOK':
      return 'bg-blue-600 text-white';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Format relative time
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

