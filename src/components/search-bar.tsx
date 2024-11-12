// components/search-bar.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // components/search-bar.tsx
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Replace any sequence of spaces with a single space, then trim
    const cleanedQuery = searchQuery.replace(/\s+/g, " ").trim();
    // Use encodeURIComponent for proper URL encoding
    router.push(`/search/${encodeURIComponent(cleanedQuery)}`);
    setSearchQuery("");
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
