// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';

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

    // Create response with success status
    const resp = NextResponse.json({ success: true });

    // Set auth token cookie
    resp.cookies.set({
      name: 'auth_token',
      value: data.access_token,
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