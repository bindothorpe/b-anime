import { ANIME } from '@consumet/extensions';

export async function GET(
  request: Request,
  { params }: { params: { query: string } }
) {
  const gogoanime = new ANIME.Gogoanime();
  const page = 1; // You can make this dynamic with searchParams if needed
  
  try {
    const results = await gogoanime.search(params.query, page);
    return Response.json(results);
  } catch (error) {
    console.error('Search error:', error);
    return Response.json(
      { error: 'Failed to fetch anime' },
      { status: 500 }
    );
  }
}