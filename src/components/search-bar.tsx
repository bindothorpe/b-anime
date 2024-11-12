// components/search-bar.tsx
"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

interface SearchBarProps {
  onSearch: (results: AnimeResult[]) => void;
  onLoadingChange: (isLoading: boolean) => void;
  isLoading?: boolean;
}

export function SearchBar({
  onSearch,
  onLoadingChange,
  isLoading = false,
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    onLoadingChange(true);
    try {
      const response = await fetch(
        `/api/anime/${encodeURIComponent(searchQuery)}`
      );
      const data: SearchResponse = await response.json();
      onSearch(data.results);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      onLoadingChange(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex gap-2 w-full">
      <Input
        type="text"
        placeholder="Search..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="flex-1"
        disabled={isLoading}
      />
      {/* Desktop Search Button */}
      <Button
        type="submit"
        disabled={isLoading}
        className="hidden sm:flex items-center gap-2"
      >
        <Search className="h-4 w-4" />
        <span>{isLoading ? "Searching..." : "Search"}</span>
      </Button>
      {/* Mobile Search Button (icon only) */}
      <Button
        type="submit"
        disabled={isLoading}
        size="icon"
        className="sm:hidden"
      >
        <Search className="h-4 w-4" />
      </Button>
    </form>
  );
}
