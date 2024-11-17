// app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { email, username, password } = await request.json();

    // Get management API token
    const tokenResponse = await fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
        grant_type: 'client_credentials'
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to get management token' },
        { status: tokenResponse.status }
      );
    }

    // Create user in Auth0
    const createUserResponse = await fetch(`https://${process.env.AUTH0_DOMAIN}/api/v2/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenData.access_token}`
      },
      body: JSON.stringify({
        email,
        nickname: username,
        password,
        connection: 'Username-Password-Authentication',
        verify_email: true
      })
    });

    const userData = await createUserResponse.json();

    if (!createUserResponse.ok) {
      return NextResponse.json(
        { error: userData.message || 'Registration failed' },
        { status: createUserResponse.status }
      );
    }

    // Create user in Prisma database using Auth0 user ID
    try {
      await prisma.user.create({
        data: {
          id: userData.user_id || userData.sub, // Auth0 user ID
          email: email,
          username: username,
        },
      });
    } catch (dbError) {
      // If database creation fails, delete the Auth0 user
      await fetch(`https://${process.env.AUTH0_DOMAIN}/api/v2/users/${userData.user_id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`
        }
      });

      console.error('Database user creation failed:', dbError);
      return NextResponse.json(
        { error: 'Failed to create user in database' },
        { status: 500 }
      );
    }

    // Log in the user after successful registration
    const loginResponse = await fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
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

    const loginData = await loginResponse.json();

    if (!loginResponse.ok) {
      console.error('Login after registration failed:', loginData);
      return NextResponse.json(
        { error: 'Registration successful but login failed' },
        { status: loginResponse.status }
      );
    }

    // Create session for the user
    const session = await prisma.session.create({
      data: {
        token: loginData.access_token,
        userId: userData.user_id || userData.sub,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      },
    });

    // Create response with success status
    const resp = NextResponse.json({ success: true });

    // Set session token cookie
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
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}