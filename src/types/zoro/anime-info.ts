export interface AnimeInfo {
    id: string;
    title: string;
    malID: number;
    alID: number;
    japaneseTitle: string;
    image: string;
    description: string;
    type: string;
    url: string;
    recommendations: Recommendation[];
    relatedAnime: RelatedAnime[];
    subOrDub: string;
    hasSub: boolean;
    hasDub: boolean;
    totalEpisodes: number;
    episodes: Episode[];
    }

export interface Episode {
    id: string;
    number: number;
    title: string;
    isFiller: boolean;
    url: string;
}

export interface Recommendation {
    id: string;
    title: string;
    url: string;
    image: string;
    duration: string;
    japaneseTitle: string;
    type: string;
    nsfw: boolean;
    sub: number;
    dub: number;
    episodes: number;
}

export interface RelatedAnime {
    id: string;
    title: string;
    url: string;
    image: string;
    type: string;
    nsfw: boolean;
    sub: number;
    dub: number;
    episodes: number;
}