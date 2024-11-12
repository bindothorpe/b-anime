// app/api/proxy/route.ts
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const urlParam = searchParams.get('url');
    const type = searchParams.get('type');
  
    if (!urlParam) {
      return new Response('Missing URL parameter', { status: 400 });
    }
  
    try {
      let decodedUrl = decodeURIComponent(urlParam);
      
      // Handle already proxied URLs
      if (decodedUrl.startsWith('/api/proxy')) {
        const proxyUrl = new URL(decodedUrl, 'http://localhost');
        decodedUrl = decodeURIComponent(proxyUrl.searchParams.get('url') || '');
      }
  
      if (!decodedUrl.startsWith('http')) {
        throw new Error('Invalid URL');
      }
  
      const response = await fetch(decodedUrl, {
        headers: {
          'Referer': 'https://s3embtaku.pro',
          'Origin': 'https://s3embtaku.pro',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const headers = new Headers();
      response.headers.forEach((value, key) => {
        // Skip problematic headers
        if (!['content-encoding', 'content-length'].includes(key.toLowerCase())) {
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
  
        // Process the m3u8 content
        const modifiedText = text.replace(
          /^(?!#)(.+\.ts)$/gm,
          (match) => {
            const absoluteUrl = match.startsWith('http') 
              ? match 
              : new URL(match, basePath).href;
            return `/api/proxy?url=${encodeURIComponent(absoluteUrl)}&type=ts`;
          }
        );
  
        headers.set('Content-Type', 'application/vnd.apple.mpegurl');
        headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        return new Response(modifiedText, { headers });
      }
  
      // Handle ts files
      if (type === 'ts') {
        headers.set('Cache-Control', 'public, max-age=31536000');
      }
  
      return new Response(response.body, { headers });
    } catch (error) {
      console.error('Proxy error:', error);
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to proxy request' }), 
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