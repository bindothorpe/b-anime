"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import AnimeResult from "@/types/anime-result";
import Image from "next/image";

interface SearchResponse {
  currentPage: number;
  hasNextPage: boolean;
  results: AnimeResult[];
}

export function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AnimeResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const debounceTimeout = useRef<NodeJS.Timeout>();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search function
  const debouncedSearch = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/anime/${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data: SearchResponse = await response.json();
      setSuggestions(data.results.slice(0, 10));
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setShowSuggestions(true);

    // Clear existing timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Set new timeout
    debounceTimeout.current = setTimeout(() => {
      debouncedSearch(query);
    }, 500); // 500ms delay
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const cleanedQuery = searchQuery.replace(/\s+/g, " ").trim();
    router.push(`/search/${encodeURIComponent(cleanedQuery)}`);
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: AnimeResult) => {
    router.push(`/anime/${encodeURIComponent(suggestion.id)}`);
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div ref={searchContainerRef} className="relative w-full">
      <form onSubmit={handleSearch} className="flex gap-2 w-full">
        <Input
          type="text"
          placeholder="Search anime..."
          value={searchQuery}
          onChange={handleInputChange}
          className="flex-1"
          onFocus={() => setShowSuggestions(true)}
        />
        {/* Desktop Search Button */}
        <Button type="submit" className="hidden sm:flex items-center gap-2">
          <Search className="h-4 w-4" />
          <span>Search</span>
        </Button>
        {/* Mobile Search Button (icon only) */}
        <Button type="submit" size="icon" className="sm:hidden">
          <Search className="h-4 w-4" />
        </Button>
      </form>

      {/* Suggestions dropdown */}
      {showSuggestions && searchQuery && (
        <Card className="fixed sm:absolute left-0 sm:left-auto mt-1 w-screen sm:w-full z-50 max-h-[400px] overflow-auto sm:rounded-md rounded-none">
          <div className="p-2">
            {isLoading ? (
              <div className="text-center py-2 text-muted-foreground">
                Loading...
              </div>
            ) : suggestions.length > 0 ? (
              <ul className="space-y-2">
                {suggestions.map((suggestion) => (
                  <li
                    key={suggestion.id}
                    className="flex items-center gap-3 p-2 hover:bg-accent rounded-md cursor-pointer"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="relative h-16 w-12 flex-shrink-0">
                      <Image
                        src={suggestion.image}
                        alt={suggestion.title}
                        fill
                        className="object-cover rounded"
                        sizes="48px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{suggestion.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {suggestion.releaseDate} • {suggestion.subOrDub}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              searchQuery.trim() && (
                <div className="text-center py-2 text-muted-foreground">
                  No results found
                </div>
              )
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
