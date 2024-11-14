import { Suspense } from "react";
import HomeContent from "@/components/home-content";

export default function Home() {
  return (
    <Suspense
      fallback={<div className="container mx-auto py-6">Loading...</div>}
    >
      <HomeContent />
    </Suspense>
  );
}
