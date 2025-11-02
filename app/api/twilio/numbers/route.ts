/**
 * API Route: Twilio Number Management
 * GET /api/twilio/numbers - List available/purchased numbers
 * POST /api/twilio/numbers - Purchase a new number
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import twilio from 'twilio';
import { z } from 'zod';

const PurchaseNumberSchema = z.object({
  phoneNumber: z.string(),
  teamId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's team memberships
    const teamMemberships = await prisma.teamMember.findMany({
      where: { userId: session.user.id },
      select: { teamId: true },
    });
    const teamIds = teamMemberships.map((tm) => tm.teamId);

    // Get stored numbers
    const numbers = await prisma.twilioNumber.findMany({
      where: {
        OR: [{ teamId: { in: teamIds } }, { teamId: null }],
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Also fetch from Twilio API
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    try {
      const twilioNumbers = await client.incomingPhoneNumbers.list({
        limit: 20,
      });

      // Merge with stored numbers
      const allNumbers = twilioNumbers.map((tn) => {
        const stored = numbers.find((n) => n.phoneNumber === tn.phoneNumber);
        return {
          phoneNumber: tn.phoneNumber,
          friendlyName: tn.friendlyName,
          capabilities: {
            sms: tn.capabilities?.sms || false,
            voice: tn.capabilities?.voice || false,
            mms: tn.capabilities?.mms || false,
          },
          isActive: stored?.isActive || true,
          teamId: stored?.teamId || null,
          team: stored?.team || null,
        };
      });

      return NextResponse.json(allNumbers);
    } catch (error) {
      // If Twilio API fails, return stored numbers
      return NextResponse.json(numbers);
    }
  } catch (error) {
    console.error('[Get Twilio Numbers] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { phoneNumber, teamId } = PurchaseNumberSchema.parse(body);

    // Check if number already exists
    const existing = await prisma.twilioNumber.findUnique({
      where: { phoneNumber },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Number already exists' },
        { status: 400 }
      );
    }

    // Fetch number details from Twilio
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // In production, you would purchase the number via Twilio API
    // For now, we'll just store it
    const twilioNumber = await prisma.twilioNumber.create({
      data: {
        phoneNumber,
        friendlyName: phoneNumber,
        capabilities: {
          sms: true,
          voice: false,
          mms: true,
        },
        teamId: teamId || null,
        isActive: true,
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(twilioNumber);
  } catch (error) {
    console.error('[Purchase Twilio Number] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

