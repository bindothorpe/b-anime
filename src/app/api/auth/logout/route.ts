// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    // Get the session token from cookies
    const cookieStore = cookies();
    const sessionToken = (await cookieStore).get('session_token')?.value;

    if (sessionToken) {
      // Delete the session from the database
      await prisma.session.delete({
        where: { token: sessionToken }
      }).catch(error => {
        // Log error but don't fail the logout
        console.error('Error deleting session:', error);
      });
    }

    const response = NextResponse.json({ success: true });
    
    // Clear the auth token cookie
    response.cookies.set({
      name: 'auth_token',
      value: '',
      expires: new Date(0),
      path: '/',
    });

    // Clear the session token cookie
    response.cookies.set({
      name: 'session_token',
      value: '',
      expires: new Date(0),
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    // Still return success even if there's an error to ensure cookies are cleared
    const response = NextResponse.json({ success: true });
    
    response.cookies.set({
      name: 'auth_token',
      value: '',
      expires: new Date(0),
      path: '/',
    });
    
    response.cookies.set({
      name: 'session_token',
      value: '',
      expires: new Date(0),
      path: '/',
    });

    return response;
  }
}