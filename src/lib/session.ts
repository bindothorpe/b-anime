// lib/session.ts
import { cookies } from 'next/headers';
import { prisma } from './prisma';

export interface SessionUser {
  id: string;
  email: string;
  username: string;
}

interface Session {
  user: SessionUser;
}

export async function getServerSession(): Promise<Session | null> {
  try {
    const cookieStore = cookies();
    const sessionToken = (await cookieStore).get('session_token')?.value;

    if (!sessionToken) {
      return null;
    }

    const session = await prisma.session.findUnique({
      where: {
        token: sessionToken,
      },
      include: {
        user: true,
      },
    });

    if (!session || session.expires < new Date()) {
      return null;
    }

    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        username: session.user.username,
      },
    };
  } catch (error) {
    console.error('Session error:', error);
    return null;
  }
}