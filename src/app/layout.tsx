// app/layout.tsx
import "./globals.css";
import { Providers } from "@/components/providers";
import { NavBar } from "@/components/nav-bar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <div className="min-h-screen flex flex-col">
            {/* Fixed Navigation */}
            <div className="fixed top-0 left-0 right-0 z-50">
              <NavBar />
            </div>

            {/* Main Content with padding for navbar */}
            <main className="flex-grow pt-16">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
