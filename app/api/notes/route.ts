/**
 * API Route: Notes Management
 * GET /api/notes?contactId=...
 * POST /api/notes
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CreateNoteSchema = z.object({
  contactId: z.string(),
  content: z.string().min(1),
  isPrivate: z.boolean().optional(),
  title: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contactId = request.nextUrl.searchParams.get('contactId');
    if (!contactId) {
      return NextResponse.json(
        { error: 'contactId is required' },
        { status: 400 }
      );
    }

    const notes = await prisma.noteThread.findMany({
      where: {
        contactId,
        OR: [
          { isPrivate: false },
          { createdBy: session.user.id },
          {
            mentions: {
              some: {
                userId: session.user.id,
              },
            },
          },
        ],
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updater: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        mentions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error('[Get Notes] Error:', error);
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
    const validatedData = CreateNoteSchema.parse(body);

    // Extract @mentions from content
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(validatedData.content)) !== null) {
      mentions.push(match[1]);
    }

    // Create note
    const note = await prisma.noteThread.create({
      data: {
        contactId: validatedData.contactId,
        content: validatedData.content,
        title: validatedData.title,
        isPrivate: validatedData.isPrivate || false,
        createdBy: session.user.id,
        mentions: mentions.length > 0 ? {
          create: mentions.map((username) => ({
            userId: username, // In production, resolve username to userId
          })),
        } : undefined,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error('[Create Note] Error:', error);
    
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

