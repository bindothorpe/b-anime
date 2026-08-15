// Server-only scraper for hianime.at (live SSR mirror of HiAnime).
// Replaces the dead @consumet/extensions (Gogoanime provider was removed and
// the gogoanime domain itself is parked). All parsing lives here so markup
// changes from the site are fixed in one file.

const BASE_URL = "https://hianime.at";
const EMBED_XOR_KEY = "otaku-embed-v1";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

async function getText(path: string, ajax = false): Promise<string> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: ajax ? { ...HEADERS, "X-Requested-With": "XMLHttpRequest" } : HEADERS,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`hianime request failed: ${path} (${res.status})`);
  return res.text();
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—");
}

function stripTags(s: string): string {
  return decodeEntities(s.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();
}

export interface HianimeSearchResult {
  id: string;
  title: string;
  url: string;
  image: string;
  type?: string;
  duration?: string;
  subEpisodes?: number;
  dubEpisodes?: number;
}

export interface HianimeEpisode {
  id: string;
  number: number;
  url: string;
}

export interface HianimeAnimeInfo {
  id: string;
  url: string;
  title: string;
  otherName: string;
  image: string;
  description: string;
  genres: string[];
  status: string;
  type: string;
  subOrDub: string;
  releaseDate: string;
  totalEpisodes: number;
  episodes: HianimeEpisode[];
}

export interface HianimeSubtitle {
  lang: string;
  label: string;
  default?: boolean;
  src: string;
}

export interface HianimeSource {
  url: string;
  quality: string;
  isM3U8: boolean;
  headers?: Record<string, string>;
  download?: string;
  subtitles?: HianimeSubtitle[];
}

/** Split HTML into flw-item cards. */
function splitCards(html: string): string[] {
  const parts: string[] = [];
  const re = /<div class="flw-item[^"]*">/g;
  let prev: { index: number; match: string } | null = null;
  for (const m of html.matchAll(re)) {
    if (prev) parts.push(html.slice(prev.index + prev.match.length, m.index));
    prev = { index: m.index, match: m[0] };
  }
  if (prev) parts.push(html.slice(prev.index + prev.match.length));
  return parts;
}

function parseCard(card: string): HianimeSearchResult | null {
  const nameLink = card.match(/<h3 class="film-name">[\s\S]*?<a href="https:\/\/hianime\.at\/([^"]+)"[^>]*title="([^"]*)"/);
  if (!nameLink) return null;
  const id = nameLink[1];
  const title = decodeEntities(nameLink[2]);
  const image = card.match(/<img[^>]*src="([^"]+)"[^>]*class="film-poster-img"/)?.at(1)
    ?? card.match(/class="film-poster-img"[^>]*src="([^"]+)"/)?.at(1);
  const sub = card.match(/tick-sub[^>]*>[\s\S]*?(\d+)/)?.at(1);
  const dub = card.match(/tick-dub[^>]*>[\s\S]*?(\d+)/)?.at(1);
  const type = card.match(/fdi-item">([^<]+)/)?.at(1);
  const duration = card.match(/fdi-item fdi-duration">([^<]+)/)?.at(1);
  return {
    id,
    title,
    url: `/anime/${id}`,
    image: image ?? "",
    type: type?.trim(),
    duration: duration?.trim(),
    subEpisodes: sub ? Number(sub) : undefined,
    dubEpisodes: dub ? Number(dub) : undefined,
  };
}

/** Search: single SSR page, max 36 results (site has no server-side pagination). */
export async function searchAnime(query: string, page = 1): Promise<{
  currentPage: number;
  hasNextPage: boolean;
  results: HianimeSearchResult[];
}> {
  if (page > 1) return { currentPage: page, hasNextPage: false, results: [] };
  const html = await getText(`/search?keyword=${encodeURIComponent(query)}`);
  return {
    currentPage: 1,
    hasNextPage: false,
    results: splitCards(html)
      .map(parseCard)
      .filter((r): r is HianimeSearchResult => r !== null),
  };
}

function parseEpisodeItems(html: string): HianimeEpisode[] {
  const eps: HianimeEpisode[] = [];
  const re = /<a title="[^"]*"\s*class="ssl-item ep-item"[\s\S]*?data-number="(\d+)"[\s\S]*?data-id="(\d+)"[\s\S]*?href="([^"]+)"/g;
  for (const m of html.matchAll(re)) {
    eps.push({ id: m[2], number: Number(m[1]), url: m[3] });
  }
  return eps;
}

/** Full episode list for a numeric anime id (single response, no pagination). */
export async function getEpisodeList(animeId: string): Promise<HianimeEpisode[]> {
  const listHtml = await getText(`/api/theme/episode/list/${animeId}`, true);
  return parseEpisodeItems(JSON.parse(listHtml).html ?? "");
}

export async function getAnimeInfo(slug: string): Promise<HianimeAnimeInfo> {
  const html = await getText(`/${encodeURIComponent(slug)}`);

  const animeId = html.match(/<meta name="hi-anime-id" content="(\d+)"/)?.at(1) ?? "";
  const title = stripTags(html.match(/<h2 class="film-name[^"]*"[^>]*>([\s\S]*?)<\/h2>/)?.at(1) ?? "");
  const otherName = html.match(/<h2 class="film-name[^"]*" data-jname="([^"]*)"/)?.at(1) ?? "";
  const image =
    html.match(/<div class="anisc-poster">[\s\S]*?<img[^>]*src="([^"]+)"/)?.at(1)
    ?? html.match(/<meta property="og:image" content="([^"]+)"/)?.at(1)
    ?? "";

  const tickSub = html.match(/tick-sub[^>]*>[\s\S]*?(\d+)/)?.at(1);
  const tickDub = html.match(/tick-dub[^>]*>[\s\S]*?(\d+)/)?.at(1);
  const tickEps = html.match(/tick-eps[^>]*>[\s\S]*?(\d+)/)?.at(1);

  const stats = [...html.matchAll(/<span class="item">([^<]+)<\/span>/g)].map((m) => m[1].trim());
  const type = stats[0] ?? "";

  const descBlock = html.match(/<div class="film-description[^"]*">[\s\S]*?<div class="text">([\s\S]*?)<\/div>/);
  const description = stripTags(descBlock?.at(1) ?? "");
  const overview = html.match(/<span class="item-head">Overview:<\/span>[\s\S]*?<div class="text">([\s\S]*?)<\/div>/);
  const genresBlock = html.match(/<span class="item-head">Genres:<\/span>([\s\S]*?)(?=<span class="item-head">|<\/div>\s*<\/div>)/);
  const genres = genresBlock
    ? [...genresBlock[1].matchAll(/<a[^>]*>([^<]+)<\/a>/g)].map((m) => m[1].trim())
    : [];
  const status = html.match(/<span class="item-head">Status:<\/span>[\s\S]*?<span class="name">([^<]+)/)?.at(1)?.trim() ?? "";
  const releaseDate = html.match(/<span class="item-head">Aired:<\/span>[\s\S]*?<span class="name">([^<]+)/)?.at(1)?.trim() ?? "";

  const subOrDub = tickDub && !tickSub ? "DUB" : "SUB";

  let episodes: HianimeEpisode[] = [];
  if (animeId) {
    try {
      episodes = await getEpisodeList(animeId);
    } catch {
      episodes = [];
    }
  }

  return {
    id: slug,
    url: `/anime/${slug}`,
    title: title || slug,
    otherName,
    image,
    description: description || stripTags(overview?.at(1) ?? ""),
    genres,
    status,
    type,
    subOrDub,
    releaseDate,
    totalEpisodes: episodes.length || Number(tickEps ?? 0),
    episodes,
  };
}

/** Recent episodes feed (paginated). Episode numbers come from the sub/dub
 *  counts on the cards (the site links "?ep=latest" without numbers). */
export async function getRecentEpisodes(page = 1, type = 1): Promise<{
  currentPage: number;
  hasNextPage: boolean;
  results: Array<
    HianimeSearchResult & {
      episodeId: string;
      episodeNumber: number;
    }
  >;
}> {
  // hianime.at has no Chinese dubs — return empty rather than mixing in subs
  if (type === 3) {
    return { currentPage: page, hasNextPage: false, results: [] };
  }

  const html = await getText(`/recently-updated?page=${page}`);
  const results = splitCards(html)
    .map(parseCard)
    .filter((r): r is HianimeSearchResult => r !== null)
    .filter((r) => (type === 2 ? (r.dubEpisodes ?? 0) > 0 : true))
    .map((r) => {
      const count = type === 2 ? r.dubEpisodes ?? 0 : r.subEpisodes ?? 0;
      const episodeNumber = count || 1;
      return {
        ...r,
        episodeId: `${r.id}-episode-${episodeNumber}`,
        episodeNumber,
      };
    });

  const hasNextPage = new RegExp(`page=${page + 1}\\b`).test(html);
  return { currentPage: page, hasNextPage, results };
}

/** XOR-decode the obfuscated player payload from the embed page. */
function xorDecode(blob: string): string {
  const raw = Buffer.from(blob, "base64");
  const key = Buffer.from(EMBED_XOR_KEY, "latin1");
  const out = Buffer.alloc(raw.length);
  for (let i = 0; i < raw.length; i++) {
    out[i] = raw[i] ^ key[i % key.length];
  }
  return out.toString("utf8");
}

/** Available servers for an episode (names + base64 embed hashes). */
export async function getEpisodeServers(
  episodeId: string
): Promise<Array<{ name: string; hash: string }>> {
  const serversHtml = JSON.parse(
    await getText(`/api/theme/episode/servers?episodeId=${encodeURIComponent(episodeId)}`, true)
  ).html as string;

  const servers: Array<{ name: string; hash: string }> = [];
  const re = /data-server-name="([^"]+)"[\s\S]*?data-hash="([^"]+)"/g;
  for (const m of serversHtml.matchAll(re)) servers.push({ name: m[1], hash: m[2] });
  return servers;
}

/** MegaPlay embeds (HD-2 server): no window.__P — the stream comes from their
 *  own getSources API keyed by the player div's data-id. */
async function getMegaplaySources(
  embedHtml: string,
  embedUrl: string
): Promise<HianimeSource> {
  const dataId =
    embedHtml.match(/id="megaplay-player"[\s\S]*?data-id="(\d+)"/)?.at(1) ??
    embedHtml.match(/data-id="(\d+)"/)?.at(1);
  if (!dataId) throw new Error("MegaPlay player id not found");

  const origin = new URL(embedUrl).origin;
  const res = await fetch(
    `${origin}/stream/getSources?id=${dataId}&id=${dataId}`,
    {
      headers: { ...HEADERS, "X-Requested-With": "XMLHttpRequest", Referer: embedUrl },
      cache: "no-store",
    }
  );
  if (!res.ok) throw new Error(`MegaPlay sources failed: ${res.status}`);
  const data = (await res.json()) as {
    sources?: { file?: string };
    tracks?: Array<{
      file?: string;
      label?: string;
      kind?: string;
      default?: boolean;
    }>;
  };
  if (!data.sources?.file) throw new Error("No stream URL in megaplay payload");

  return {
    url: data.sources.file,
    quality: "auto",
    isM3U8: data.sources.file.includes(".m3u8"),
    // the stream CDN 403s unless the referer is exactly the site origin + "/"
    headers: { Referer: `${origin}/` },
    subtitles: (data.tracks ?? [])
      .filter((t) => t.kind === "captions" && typeof t.file === "string")
      .map((t) => ({
        lang: "en",
        label: t.label ?? "English",
        default: t.default === true,
        src: t.file as string,
      })),
  };
}

/** Resolve episode sources: servers → embed URL → obfuscated payload → m3u8. */
export async function getEpisodeSources(
  episodeId: string,
  serverName?: string,
  servers?: Array<{ name: string; hash: string }>
): Promise<HianimeSource> {
  const allServers = servers ?? (await getEpisodeServers(episodeId));
  if (allServers.length === 0) throw new Error("No stream servers found");

  const requested = serverName
    ? allServers.find((s) => s.name.toLowerCase() === serverName.toLowerCase())
    : undefined;
  const server = requested ?? allServers[0];
  const embedUrl = Buffer.from(server.hash, "base64").toString("utf8");

  const embedRes = await fetch(embedUrl, {
    headers: { ...HEADERS, Referer: BASE_URL },
    cache: "no-store",
  });
  if (!embedRes.ok) throw new Error(`Embed fetch failed: ${embedRes.status}`);
  const embedHtml = await embedRes.text();

  // MegaPlay (HD-2) uses a different player — parse via its own API
  if (new URL(embedUrl).hostname === "megaplay.buzz") {
    return getMegaplaySources(embedHtml, embedUrl);
  }

  const payload = embedHtml.match(/window\.__P="([^"]+)"/)?.at(1);
  if (!payload) throw new Error("Player payload not found on embed page");

  const data = JSON.parse(xorDecode(payload)) as {
    src?: string;
    download_url?: string;
    subtitles?: Array<{
      lang?: string;
      label?: string;
      default?: boolean;
      src?: string;
    }>;
  };
  if (!data.src) throw new Error("No stream URL in player payload");

  const src = data.src.startsWith("http")
    ? data.src
    : `${new URL(embedUrl).origin}${data.src}`;

  const subtitles = (data.subtitles ?? [])
    .filter((s) => typeof s.src === "string")
    .map((s) => ({
      lang: s.lang ?? "en",
      label: s.label ?? "English",
      default: s.default === true,
      src: s.src as string,
    }));

  return {
    url: src,
    quality: "auto",
    isM3U8: src.includes(".m3u8"),
    headers: { Referer: new URL(embedUrl).origin },
    download: data.download_url
      ? `${new URL(embedUrl).origin}${data.download_url}`
      : undefined,
    subtitles,
  };
}
