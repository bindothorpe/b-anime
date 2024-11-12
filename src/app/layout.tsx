// app/layout.tsx
import "./globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Providers } from "@/components/providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {/* <SidebarProvider> */}
        <Providers>
          {/* <AppSidebar /> */}
          <main>
            {/* <SidebarTrigger /> */}
            {children}
          </main>
        </Providers>
        {/* </SidebarProvider> */}
      </body>
    </html>
  );
}
