import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const urlParam = searchParams.get('url');
  const type = searchParams.get('type');

  if (!urlParam) {
    return new Response('Missing URL parameter', { status: 400 });
  }

  try {
    let decodedUrl = decodeURIComponent(urlParam);
    
    // Handle relative paths for .ts files
    if (decodedUrl.startsWith('ep.')) {
      const referer = request.headers.get('referer') || '';
      const refererUrl = new URL(referer);
      const pathParts = refererUrl.pathname.split('/');
      pathParts.pop();
      const basePath = pathParts.join('/');
      decodedUrl = `${refererUrl.origin}${basePath}/${decodedUrl}`;
    }
    
    // Handle already proxied URLs
    if (decodedUrl.startsWith('/api/proxy')) {
      const baseUrl = new URL(request.url).origin;
      const proxyUrl = new URL(decodedUrl, baseUrl);
      decodedUrl = decodeURIComponent(proxyUrl.searchParams.get('url') || '');
    }

    if (!decodedUrl.startsWith('http')) {
      throw new Error('Invalid URL');
    }

    // Add port number handling for URLs with custom ports
    const url = new URL(decodedUrl);
    const port = url.port ? `:${url.port}` : '';
    const origin = `${url.protocol}//${url.hostname}${port}`;

    const response = await fetch(decodedUrl, {
      headers: {
        'Referer': origin,
        'Origin': origin,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const headers = new Headers();
    response.headers.forEach((value, key) => {
      // Preserve content-length for ts files
      if (!['content-encoding'].includes(key.toLowerCase()) && 
          !(key.toLowerCase() === 'content-length' && type !== 'ts')) {
        headers.set(key, value);
      }
    });

    // Set CORS headers
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', '*');

    // Handle m3u8 files
    if (type === 'm3u8') {
      const text = await response.text();
      const baseUrl = new URL(decodedUrl);
      const basePath = baseUrl.href.substring(0, baseUrl.href.lastIndexOf('/') + 1);

      // Process the m3u8 content with improved regex
      const modifiedText = text.replace(
        /^(?!#)(.+(?:\.ts|\.m3u8))$/gm,
        (match) => {
          const segmentUrl = match.startsWith('http') 
            ? match 
            : new URL(match, basePath).href;
          const segmentType = match.endsWith('.ts') ? 'ts' : 'm3u8';
          return `/api/proxy?url=${encodeURIComponent(segmentUrl)}&type=${segmentType}`;
        }
      );

      headers.set('Content-Type', 'application/vnd.apple.mpegurl');
      headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      return new Response(modifiedText, { headers });
    }

    // Handle ts files
    if (type === 'ts') {
      headers.set('Content-Type', 'video/mp2t');
      headers.set('Cache-Control', 'public, max-age=31536000');
    }

    return new Response(response.body, { headers });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to proxy request',
        url: decodeURIComponent(urlParam || ''),
      }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}