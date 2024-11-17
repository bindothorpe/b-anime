// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const tokenResponse = await fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'http://auth0.com/oauth/grant-type/password-realm',
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        username: email,
        password: password,
        realm: 'Username-Password-Authentication',
        scope: 'openid profile email',
        audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Auth0 error:', errorData);
      return NextResponse.json(
        { error: errorData.error_description || 'Login failed' },
        { status: tokenResponse.status }
      );
    }

    const data = await tokenResponse.json();

    // Get user info from Auth0 to get the user ID
    const userInfoResponse = await fetch(`https://${process.env.AUTH0_DOMAIN}/userinfo`, {
      headers: {
        Authorization: `Bearer ${data.access_token}`
      }
    });

    if (!userInfoResponse.ok) {
      console.error('Failed to get user info');
      return NextResponse.json(
        { error: 'Login failed' },
        { status: userInfoResponse.status }
      );
    }

    const userInfo = await userInfoResponse.json();

    // Find or create user in database
    let user = await prisma.user.findUnique({
      where: { id: userInfo.sub }
    });

    if (!user) {
      // Create user if they don't exist (might happen if they were created in Auth0 but not in your db)
      user = await prisma.user.create({
        data: {
          id: userInfo.sub,
          email: userInfo.email,
          username: userInfo.nickname || userInfo.email,
        },
      });
    }

    // Delete any existing sessions for this user
    await prisma.session.deleteMany({
      where: { userId: user.id }
    });

    // Create new session
    const session = await prisma.session.create({
      data: {
        token: data.access_token,
        userId: user.id,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      },
    });

    // Create response with success status
    const resp = NextResponse.json({ success: true });

    // Set both auth token and session token cookies
    resp.cookies.set({
      name: 'auth_token',
      value: data.access_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    resp.cookies.set({
      name: 'session_token',
      value: session.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    return resp;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    );
  }
}