import { ANIME } from '@consumet/extensions';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ query: string }> }
) {
  const { searchParams } = new URL(request.url);
  const query = (await params).query
  const page = Number(searchParams.get('page')) || 1;
  const decodedQuery = decodeURIComponent(query);
  
  const zoro = new ANIME.Zoro();
  
  try {
    const data = await zoro.search(decodedQuery, page);
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching anime:', error);
    return Response.json(
      { error: 'Failed to fetch anime' },
      { status: 500 }
    );
  }
}