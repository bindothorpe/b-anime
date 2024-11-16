// app/api/auth/me/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = (await cookieStore).get('auth_token');

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const response = await fetch(`https://${process.env.AUTH0_DOMAIN}/userinfo`, {
      headers: {
        Authorization: `Bearer ${token.value}`,
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch user info' },
        { status: response.status }
      );
    }

    const userData = await response.json();
    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error fetching user info:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}