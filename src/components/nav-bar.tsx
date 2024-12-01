// components/nav-bar.tsx
"use client";

import Link from "next/link";
import { Home, Menu, PlaySquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SearchBar } from "./zoro/search-bar";

export function NavBar() {
  return (
    <nav className="border-b bg-background">
      <div className="flex h-16 items-center px-4 sm:px-6">
        {/* Mobile Menu */}
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-4">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>bAnime</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-4">
                <Link
                  href="/"
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Link>
                <Link
                  href="/continue-watching"
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <PlaySquare className="h-4 w-4" />
                  <span>Continue Watching</span>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Logo */}
        <Link href="/" className="font-bold text-xl mr-8">
          bAnime
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 hover:text-primary transition-colors"
          >
            <Home className="h-4 w-4" />
            <span>Home</span>
          </Link>
          <Link
            href="/zoro/continue-watching"
            className="flex items-center gap-2 hover:text-primary transition-colors"
          >
            <PlaySquare className="h-4 w-4" />
            <span>Continue Watching</span>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="flex-1 flex justify-end px-4 max-w-3xl ml-auto">
          <div className="w-full max-w-[500px]">
            <SearchBar />
          </div>
        </div>
      </div>
    </nav>
  );
}
