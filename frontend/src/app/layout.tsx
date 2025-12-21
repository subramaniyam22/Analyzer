"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { usePathname } from "next/navigation";
import { AuthProvider } from "@/context/AuthContext";

import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <div className="flex h-screen bg-background overflow-hidden">
            <MainLayout>{children}</MainLayout>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}

function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = ["/login", "/register", "/forgot-password"].includes(pathname);

  return (
    <>
      {!isAuthPage && <Sidebar />}
      <main className="flex-1 overflow-y-auto relative bg-grid-white/[0.02]">
        <div className="absolute inset-0 bg-gradient-to-tr from-background via-background/95 to-primary/10 pointer-events-none" />
        <div className={cn("relative z-10 min-h-full", !isAuthPage && "px-12 py-10")}>
          {children}
        </div>
      </main>
    </>
  );
}
