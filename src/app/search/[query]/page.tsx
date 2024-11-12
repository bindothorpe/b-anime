// app/search/[query]/page.tsx
"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimeGrid } from "@/components/anime-grid";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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

export default function SearchPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const query = params.query as string;
  const currentPage = Number(searchParams.get("page")) || 1;

  const [results, setResults] = useState<AnimeResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNextPage, setHasNextPage] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/anime/${encodeURIComponent(query)}?page=${currentPage}`
        );
        const data: SearchResponse = await response.json();
        setResults(data.results);
        setHasNextPage(data.hasNextPage);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [query, currentPage]);

  const handlePageChange = (page: number) => {
    router.push(`/search/${query}?page=${page}`);
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
        Search Results for "{query.replaceAll("%20", " ")}"
      </h1>
      <AnimeGrid results={results} isLoading={isLoading} />

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
          No results found for "{query}"
        </div>
      )}
    </div>
  );
}
