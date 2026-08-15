# b-anime

Old Next.js 15 anime streaming app (educational project — no owned content). Client-side UI with server API routes that scrape **hianime.at** (a live SSR mirror of HiAnime); there is no backend database. All content comes from hianime.at and its stream CDN.

## Commands

```bash
pnpm dev          # dev server (port 3000)
pnpm build        # production build
pnpm lint         # next lint
npx tsc --noEmit  # type-check
```

## Stack

- Next.js 15.0.3 (App Router), React 19 RC, TypeScript, pnpm
- Tailwind + shadcn-style components (`src/components/ui/`, Radix primitives)
- `hls.js` for video playback, `next-themes` for theming
- Path alias `@/` → `src/`

## Architecture: the data pipeline

**There is no `@consumet/extensions` anymore.** All provider code is gone — the library dropped its providers (and the gogoanime domain is parked). Everything is hand-rolled scraping, isolated in **`src/lib/hianime.ts`** (single file on purpose — hianime.at markup changes break parsers, so fixes live in one place).

```
Browser UI  →  /api/anime/* routes  →  src/lib/hianime.ts  →  hianime.at (server-side fetch)
                                                              →  zokoanime.video embed → XOR payload → HLS m3u8
Video/segments/subtitles  →  /api/proxy  →  hls2.aniwatchtv.uk (the stream CDN)
```

### Key constants (in `src/lib/hianime.ts`)

- `BASE_URL = "https://hianime.at"` — mirror changes occasionally; geo-blocks some regions. Change this one constant to re-point the app.
- AJAX endpoints under `https://hianime.at/api/theme/` need header `X-Requested-With: XMLHttpRequest`; all requests need a browser `User-Agent`.
- Stream payload on the embed page is `window.__P` (base64), XOR-decoded with key `"otaku-embed-v1"` (byte-wise XOR, cyclic, UTF-8) → JSON with `{ src, download_url, subtitles[] }`.
- Episode id format: `{slug}-episode-{number}`, e.g. `naruto-1335-episode-5`. Slugs always end in the numeric hianime anime id (`naruto-1335`). Watch route splits on the LAST `-episode-` and takes trailing digits as the numeric anime id.

### API routes

| Route | What it does |
|---|---|
| `GET /api/anime/{query}?page=` | Search hianime.at. **Only page 1 exists** (36 results max, no server-side pagination). |
| `GET /api/anime/recent?page=&type=` | Recently-updated feed. `type`: 1=Sub, 2=Dub, 3=Chinese. **Chinese is empty** (site has no chinese data). Episode numbers are **approximated** from the card's sub/dub episode counts (site links `?ep=latest` without numbers). |
| `GET /api/anime/info/{slug}` | Anime detail page: title, description, genres, status, episodes (full list via `/api/theme/episode/list/{numericId}` — one response, no pagination). |
| `GET /api/anime/watch/{episodeId}?server=` | Resolves episode → servers (`HD-1`…) → embed → XOR payload → m3u8. Returns `{ headers, sources, download, subtitles }` with URLs rewritten through `/api/proxy`. |
| `GET /api/proxy?url=&type=` | Fetches the stream CDN server-side and rewrites playlists. |

### `src/app/api/proxy` — the tricky part

- Streams live on `hls2.aniwatchtv.uk` (nginx) which requires `Referer: https://zokoanime.video/` and **403s requests that carry an `Origin` header** — never send Origin.
- `type=m3u8` rewrites every non-comment line to `/api/proxy?url=…` (variants AND segments), resolving relative paths; `type=ts` passes bytes through.
- Also proxies subtitle VTT files (same CDN, same referer rule).

### Frontend contracts

- `src/types/anime.ts`: `AnimeInfo`, `EpisodeSource` (has optional `subtitles: SubtitleTrack[]`), `HlsError`.
- `src/utils/episode.ts`: `formatEpisodeId(animeId, n)` builds the `{slug}-episode-{n}` id used by watch URLs.
- `src/hooks/use-watch-data.tsx`: watch progress stored in **localStorage** key `anime_watch_data` (`{ anime: [{ id, episodes: [{ id, secondsWatched, duration, updatedAt }] }] }`). Note: watch page stores `episodeId` = the plain episode number string.
- `src/lib/storage.ts`: SSR-safe `get`/`set` wrapper — **never use `localStorage` directly or install the `local-storage` npm package** (Node's global `localStorage` is a method-less object; it crashes SSR with `ls.getItem is not a function`).
- Continue-watching components fetch anime details via `resolveDetails` (info route first, search-by-base-name fallback for legacy slugs) — don't revert to `/api/anime/{id}` for this, it's a search route and never matches slugs.

### Pages

- `/` — home: Continue Watching section + Recent Episodes feed (tabs Sub/Dub/Chinese, paginated)
- `/search/{query}` — search results grid
- `/anime/{slug}` — anime detail page
- `/anime/{slug}/{episodeNumber}` — watch page (player + episode list)
- `/continue-watching` — grid variant of continue watching

### Gotchas

- hianime.at is a live site — markup changes silently break parsers. Test with `curl` against the site before changing regexes.
- Stream URLs are **time-limited** — a fresh one is fetched per watch request; never cache them.
- Some streams have empty `subtitles` (hardsubbed movies) — the player just shows no toggle.
- The site serves ~30-36 cards per page on `/recently-updated?page=N`; `hasNextPage` is inferred from the presence of a `page=N+1` link.
- Movie episodes (e.g. A Silent Voice) have 1 episode; multi-season shows (Naruto) return all 220 in one episode-list response.
