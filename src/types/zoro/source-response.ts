export interface SourceResponse {
  sources: EpisodeSource[];
  subtitles: SubtitleSource[];
  intro: TimeStamp;
  outro: TimeStamp;
}

export interface EpisodeSource {
  url: string;
  type: string;
  isM3U8: boolean;
}

export interface SubtitleSource {
  lang: string;
  url: string;
}

export interface TimeStamp {
  start: number;
  end: number;
}

// {
//   sources: [
//     {
//       url: 'https://eb.netmagcdn.com:2228/hls-playback/f19c9bca1251ab7ca0c7e6ad19ec59e891319ba12f2f0760ed590a714a015c92a34cd97f444eb7ef8529248b51abef0291e442acaca40e80d49b5befbed16d1b5fa3ee21ce50adf7c549ba5be91e0bd6fb908c265f9f324882c218538e90e2b3db8f4865f37dcbc33483961dd408781ed43ff02a24600b77f74a1934c58965ea1b5aae8a887a9842d566221720a2f807caffe56ff069436f6de342718c8da1f3ced6f7811bb73144bc45c450cb6b043a/master.m3u8',
//       type: 'hls',
//       isM3U8: true
//     }
//   ],
//   subtitles: [
//     {
//       url: 'https://s.megastatics.com/subtitle/5d07ca746a21f9c9f6849e1b5039b01f/5d07ca746a21f9c9f6849e1b5039b01f.vtt',
//       lang: 'English'
//     },
//     {
//       url: 'https://s.megastatics.com/thumbnails/69106814a71f57c0ed9fbad512379cd6/thumbnails.vtt',
//       lang: 'Thumbnails'
//     }
//   ],
//   intro: { start: 0, end: 0 },
//   outro: { start: 0, end: 0 }
// }