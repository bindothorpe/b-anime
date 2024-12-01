import HomeContent from "@/components/zoro/home-content";
import { Suspense } from "react";

export default function Home() {
  return (
    <Suspense fallback={<div className="container mx-auto py-6"></div>}>
      <HomeContent />
    </Suspense>
  );
}
