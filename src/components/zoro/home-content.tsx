"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { CustomTabs } from "@/components/custom-tabs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import RecentResponse from "@/types/zoro/recent-response";
import AnimeResponse from "@/types/zoro/anime-response";
import { RecentEpisodesGrid } from "./anime/recent-episodes/recent-episodes-grid";
// import { ContinueWatchingSection } from "./anime/continue-watching/continue-watching-section";

export default function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentPage = Number(searchParams.get("page")) || 1;
  const currentTab = searchParams.get("type") || "1";

  const [results, setResults] = useState<AnimeResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNextPage, setHasNextPage] = useState(false);

  const tabItems = {
    Sub: "1",
    Dub: "2",
    Chinese: "3",
  };

  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/zoro/anime/recent?page=${currentPage}`
        );
        const data: RecentResponse = await response.json();
        setResults(data.results);
        setHasNextPage(data.hasNextPage);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [currentPage, currentTab]);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/?${params.toString()}`);
  };

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", value);
    params.set("page", "1"); // Reset to page 1 when changing tabs
    router.push(`/?${params.toString()}`);
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
      {/* <ContinueWatchingSection /> */}
      <h1 className="text-2xl font-bold mb-2 pl-4">Recent Episodes</h1>

      <div className="flex justify-between">
        {/* Tabs */}
        <div className="mb-4 pl-4">
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

      <RecentEpisodesGrid results={results} isLoading={isLoading} />

      {/* Pagination */}
      {!isLoading && results.length > 0 && (
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
      {!isLoading && results.length === 0 && (
        <div className="text-center text-muted-foreground mt-8">
          No recent episodes found
        </div>
      )}
    </div>
  );
}
