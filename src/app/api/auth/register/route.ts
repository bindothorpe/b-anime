// app/api/auth/register/route.ts
import { NextResponse } from 'next/server'

async function getManagementToken() {
  const response = await fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.AUTH0_CLIENT_ID,
      client_secret: process.env.AUTH0_CLIENT_SECRET,
      audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
      grant_type: 'client_credentials'
    })
  })
  
  const data = await response.json()
  return data.access_token
}

export async function POST(request: Request) {
  try {
    const { email, username, password } = await request.json()
    const token = await getManagementToken()
    
    const response = await fetch(`https://${process.env.AUTH0_DOMAIN}/dbconnections/signup`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        client_id: process.env.AUTH0_CLIENT_ID,
        email,
        password,
        username,
        connection: 'Username-Password-Authentication',
        user_metadata: {
          username
        }
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      console.error('Auth0 registration error:', data)
      return NextResponse.json(
        { error: data.error_description || data.message || 'Registration failed' },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}