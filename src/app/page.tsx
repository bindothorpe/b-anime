"use client";
import { RecentEpisodesGrid } from "@/components/recent-episode/recent-episodes-grid";
import { useEffect, useState } from "react";

interface EpisodeResult {
  id: string;
  episodeId: string;
  episodeNumber: number;
  title: string;
  image: string;
  url: string;
}

interface RecentEpisodeResponse {
  currentPage: number;
  hasNextPage: boolean;
  results: EpisodeResult[];
}

// app/page.tsx
export default function Home() {
  const [results, setResults] = useState<EpisodeResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNextPage, setHasNextPage] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/anime/recent`);
        const data: RecentEpisodeResponse = await response.json();
        setResults(data.results);
        setHasNextPage(data.hasNextPage);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, []);

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6 pl-4">Recent Episodes</h1>
      <RecentEpisodesGrid results={results} isLoading={isLoading} />
    </div>
  );
}
