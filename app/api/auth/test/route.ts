/**
 * Test route to check if Better Auth and Google OAuth are configured
 * GET /api/auth/test
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const hasGoogleId = !!process.env.GOOGLE_CLIENT_ID;
  const hasGoogleSecret = !!process.env.GOOGLE_CLIENT_SECRET;
  const hasAuthSecret = !!process.env.BETTER_AUTH_SECRET;
  const baseURL = process.env.BETTER_AUTH_URL || 'http://localhost:3000';

  return NextResponse.json({
    google: {
      clientId: hasGoogleId ? '✅ Set' : '❌ Not set',
      clientSecret: hasGoogleSecret ? '✅ Set' : '❌ Not set',
      configured: hasGoogleId && hasGoogleSecret,
    },
    auth: {
      secret: hasAuthSecret ? '✅ Set' : '❌ Not set',
      baseURL,
    },
    callbackURL: `${baseURL}/api/auth/callback/google`,
    instructions: {
      googleConsole: '1. Go to https://console.cloud.google.com',
      createCredentials: '2. Create OAuth 2.0 Client ID',
      redirectURI: `3. Add authorized redirect URI: ${baseURL}/api/auth/callback/google`,
      envVars: '4. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env',
    },
  });
}

