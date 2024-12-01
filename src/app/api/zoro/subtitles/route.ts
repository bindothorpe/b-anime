import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  
  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch subtitles');

    const subtitles = await response.text();

    return new NextResponse(subtitles, {
      headers: {
        'Content-Type': 'text/vtt',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error fetching subtitles:', error);
    return NextResponse.json({ error: 'Failed to fetch subtitles' }, { status: 500 });
  }
}