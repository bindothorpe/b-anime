// app/page.tsx
"use client";

import { useState } from "react";
import { NavBar } from "@/components/nav-bar";
import { AnimeGrid } from "@/components/anime-grid";

interface AnimeResult {
  id: string;
  title: string;
  url: string;
  image: string;
  releaseDate: string;
  subOrDub: string;
}

interface SearchResponse {
  currentPage: number;
  hasNextPage: boolean;
  results: AnimeResult[];
}

export default function Home() {
  const [searchResults, setSearchResults] = useState<AnimeResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <NavBar
        onSearch={setSearchResults}
        onLoadingChange={setIsLoading}
        isLoading={isLoading}
      />
      <main className="container mx-auto pt-6">
        <AnimeGrid results={searchResults} isLoading={isLoading} />
      </main>
    </div>
  );
}
