// Footer with educational disclaimer
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t mt-12">
      <div className="container mx-auto py-6 px-4">
        <p className="text-sm text-center text-muted-foreground">
          This is an <span className="font-semibold">educational project</span>{" "}
          built to learn about streaming and web development. I do not own or
          host any of the content listed, and all anime titles, images, and
          streams belong to their respective owners.
        </p>
        <p className="text-xs text-center text-muted-foreground/70 mt-2">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          {" · "}bAnime
        </p>
      </div>
    </footer>
  );
}
