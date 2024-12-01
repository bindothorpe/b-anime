"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SearchResponse } from "@/types/zoro/search-response";
import { AnimeGrid } from "@/components/zoro/anime/anime-grid";
import { useZoro } from "@/hooks/use-zoro";

export default function SearchPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const query = params.query as string;
  const currentPage = Number(searchParams.get("page")) || 1;

  const [searchResponse, setSearchResponse] = useState<SearchResponse>();
  const [isLoading, setIsLoading] = useState(true);
  const { searchAnime } = useZoro();

  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true);

      const response = await searchAnime(query, currentPage);

      if (response.hasError) {
        console.error("Search error:", response.error);
      } else {
        setSearchResponse(response.data);
      }

      setIsLoading(false);
    };

    fetchResults();
  }, [query, currentPage]);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/search/${query}?${params.toString()}`);
  };

  // Generate array of page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxPages = searchResponse?.hasNextPage
      ? currentPage + 1
      : currentPage;
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

      <div className="flex justify-end">
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
            disabled={!searchResponse?.hasNextPage}
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(currentPage + 1);
            }}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      {searchResponse?.results && (
        <AnimeGrid results={searchResponse?.results} isLoading={isLoading} />
      )}

      {/* Pagination */}
      {!isLoading && !searchResponse?.results && (
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
              {searchResponse?.hasNextPage && (
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
      {!isLoading && searchResponse?.results === null && (
        <div className="text-center text-muted-foreground mt-8">
          No results found for &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  );
}
