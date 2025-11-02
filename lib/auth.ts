/**
 * Better Auth Configuration
 * Handles authentication with credentials and Google OAuth
 */

import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@prisma/client';

// Create Prisma client instance for Better Auth
// Better Auth needs direct access to PrismaClient
const prismaClient = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

export const auth = betterAuth({
  database: prismaAdapter(prismaClient, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      enabled: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  secret: process.env.BETTER_AUTH_SECRET || 'change-me-in-production',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
});

export type Session = typeof auth.$Infer.Session;

