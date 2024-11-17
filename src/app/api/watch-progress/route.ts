// app/api/watch-progress/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    console.log('Session:', session); // Debug log

    if (!session?.user) {
      console.log('No session user found'); // Debug log
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('Request body:', body); // Debug log

    const { animeId, episodeNumber, timestamp } = body;

    if (!animeId || episodeNumber === undefined || timestamp === undefined) {
      console.log('Missing fields:', { animeId, episodeNumber, timestamp }); // Debug log
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('Attempting upsert with:', { 
      userId: session.user.id, 
      animeId, 
      episodeNumber, 
      timestamp 
    }); // Debug log

    const progress = await prisma.watchProgress.upsert({
      where: {
        userId_animeId: {
          userId: session.user.id,
          animeId,
        },
      },
      update: {
        episodeNumber,
        timestamp,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        animeId,
        episodeNumber,
        timestamp,
      },
    });

    console.log('Progress updated:', progress); // Debug log
    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error details:', error); // Detailed error log
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    console.log('GET Session:', session); // Debug log

    if (!session?.user) {
      console.log('GET: No session user found'); // Debug log
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const animeId = searchParams.get('animeId');
    console.log('GET Request for animeId:', animeId); // Debug log

    if (!animeId) {
      return NextResponse.json({ error: 'Missing animeId' }, { status: 400 });
    }

    const progress = await prisma.watchProgress.findUnique({
      where: {
        userId_animeId: {
          userId: session.user.id,
          animeId,
        },
      },
    });

    console.log('GET Progress found:', progress); // Debug log
    return NextResponse.json(progress);
  } catch (error) {
    console.error('GET Error details:', error); // Detailed error log
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}