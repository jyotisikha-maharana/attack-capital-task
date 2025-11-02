/**
 * Cron Job: Process Scheduled Messages
 * This should be called by a cron service (e.g., Vercel Cron, GitHub Actions)
 * GET /api/cron/scheduled-messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { processScheduledMessages } from '@/app/api/scheduled-messages/route';

export async function GET(request: NextRequest) {
  // Verify cron secret (recommended for production)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await processScheduledMessages();
    return NextResponse.json({ success: true, message: 'Processed scheduled messages' });
  } catch (error) {
    console.error('[Cron] Error processing scheduled messages:', error);
    return NextResponse.json(
      { error: 'Failed to process scheduled messages' },
      { status: 500 }
    );
  }
}

