"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimeGrid } from "@/components/anime/anime-grid";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { CustomTabs } from "@/components/custom-tabs";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import AnimeResult from "@/types/anime-result";

interface SearchResponse {
  currentPage: number;
  hasNextPage: boolean;
  results: AnimeResult[];
}

export default function SearchPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const query = params.query as string;
  const currentPage = Number(searchParams.get("page")) || 1;
  const currentTab = searchParams.get("type") || "1";

  const [filteredResults, setFilteredResults] = useState<AnimeResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNextPage, setHasNextPage] = useState(false);

  const tabItems = {
    Sub: "1",
    Dub: "2",
    Chinese: "3",
  };

  // Filter results based on currentTab
  const filterResults = (results: AnimeResult[], type: string) => {
    return results.filter((anime) => {
      switch (type) {
        case "1": // Sub
          return anime.subOrDub.toLowerCase() === "sub";
        case "2": // Dub
          return anime.subOrDub.toLowerCase() === "dub";
        case "3": // Chinese
          return anime.subOrDub.toLowerCase() === "chinese";
        default:
          return true;
      }
    });
  };

  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/anime/${encodeURIComponent(query)}?page=${currentPage}`
        );
        const data: SearchResponse = await response.json();

        // Filter results based on current tab
        const filtered = filterResults(data.results, currentTab);
        setFilteredResults(filtered);

        // Update hasNextPage based on filtered results
        setHasNextPage(filtered.length >= 20); // Assuming 20 is the page size
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [query, currentPage, currentTab]);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/search/${query}?${params.toString()}`);
  };

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", value);
    params.set("page", "1"); // Reset to page 1 when changing tabs
    router.push(`/search/${query}?${params.toString()}`);
  };

  // Generate array of page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxPages = hasNextPage ? currentPage + 1 : currentPage;
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(maxPages, currentPage + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6 pl-4">
        Search Results for &ldquo;{query.replaceAll("%20", " ")}&rdquo;
      </h1>

      <div className="flex justify-between">
        {/* Tabs */}
        <div className="mb-6 pl-4">
          <CustomTabs items={tabItems} onTabChange={handleTabChange} />
        </div>

        {/* Top pagination */}
        <div className="pr-4 flex gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={currentPage <= 1}
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(currentPage - 1);
            }}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled={!hasNextPage}
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(currentPage + 1);
            }}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      <AnimeGrid results={filteredResults} isLoading={isLoading} />

      {/* Pagination */}
      {!isLoading && filteredResults.length > 0 && (
        <div className="mt-8">
          <Pagination>
            <PaginationContent>
              {/* Previous button */}
              {currentPage > 1 && (
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(currentPage - 1);
                    }}
                  />
                </PaginationItem>
              )}

              {/* Page numbers */}
              {getPageNumbers().map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(page);
                    }}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}

              {/* Next button */}
              {hasNextPage && (
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(currentPage + 1);
                    }}
                  />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* No results message */}
      {!isLoading && filteredResults.length === 0 && (
        <div className="text-center text-muted-foreground mt-8">
          No results found for &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  );
}
