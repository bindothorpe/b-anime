import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const urlParam = searchParams.get('url');
  const type = searchParams.get('type');
  // Non-zokoanime CDNs (e.g. megaplay.buzz) need their own Referer — the
  // watch route passes it as `ref`. Default keeps hls2.aniwatchtv.uk working.
  const refParam = searchParams.get('ref');
  const referer = refParam ?? 'https://zokoanime.video/';

  if (!urlParam) {
    return new Response('Missing URL parameter', { status: 400 });
  }

  try {
    // searchParams.get already decodes once — decoding again would corrupt
    // percent-escapes inside the URL (e.g. tiktokcdn segment signatures
    // contain %2F/%3D, which 403 when sent decoded).
    let decodedUrl = urlParam;
    
    // Handle relative paths for .ts files
    if (decodedUrl.startsWith('ep.')) {
      // Extract the base URL from the Referer header
      const referer = request.headers.get('referer') || '';
      const refererUrl = new URL(referer);
      const pathParts = refererUrl.pathname.split('/');
      // Remove the last part of the path (filename)
      pathParts.pop();
      const basePath = pathParts.join('/');
      // Construct the full URL
      decodedUrl = `${refererUrl.origin}${basePath}/${decodedUrl}`;
    }
    
    // Handle already proxied URLs
    if (decodedUrl.startsWith('/api/proxy')) {
      const baseUrl = new URL(request.url).origin;
      const proxyUrl = new URL(decodedUrl, baseUrl);
      decodedUrl = proxyUrl.searchParams.get('url') || '';
    }

    if (!decodedUrl.startsWith('http')) {
      throw new Error('Invalid URL');
    }

    // The stream CDNs require the embed page's Referer and reject requests
    // carrying an Origin header (403 otherwise).
    const response = await fetch(decodedUrl, {
      headers: {
        'Referer': referer,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const headers = new Headers();
    response.headers.forEach((value, key) => {
      if (!['content-encoding', 'content-length'].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    // Set CORS headers
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', '*');

    // Handle m3u8 files: rewrite every non-comment line through the proxy,
    // resolving relative variant/segment paths against the fetched playlist.
    if (type === 'm3u8') {
      const text = await response.text();
      const baseUrl = new URL(decodedUrl);
      const basePath = baseUrl.href.substring(0, baseUrl.href.lastIndexOf('/') + 1);

      const modifiedText = text.replace(/^(?!#)(.+)$/gm, (line) => {
        const absoluteUrl = line.startsWith('http')
          ? line
          : new URL(line, basePath).href;
        const isPlaylist = absoluteUrl.includes('.m3u8');
        const ref = refParam ? `&ref=${encodeURIComponent(referer)}` : '';
        return `/api/proxy?url=${encodeURIComponent(absoluteUrl)}&type=${isPlaylist ? 'm3u8' : 'ts'}${ref}`;
      });

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