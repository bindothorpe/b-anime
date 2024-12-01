"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const cleanedQuery = searchQuery.replace(/\s+/g, " ").trim();
    router.push(`/zoro/search/${encodeURIComponent(cleanedQuery)}`);
    setSearchQuery("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
  };
  return (
    <div ref={searchContainerRef} className="relative w-full">
      <form onSubmit={handleSearch} className="flex gap-2 w-full">
        <Input
          type="text"
          placeholder="Search anime..."
          value={searchQuery}
          className="flex-1"
          onChange={handleInputChange}
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
    </div>
  );
}
