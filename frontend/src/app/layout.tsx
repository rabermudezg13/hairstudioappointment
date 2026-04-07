"use client";

import "./globals.css";
import { Inter } from "next/font/google";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/Navbar";
import { useState } from "react";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 1000 * 30, retry: 1 } },
  }));

  return (
    <html lang="es">
      <head>
        <title>Ludy Hair Studio</title>
        <meta name="description" content="Sistema de citas para Ludy Hair Studio" />
      </head>
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <QueryClientProvider client={queryClient}>
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <Toaster
            position="top-right"
            toastOptions={{
              className: "text-sm font-medium",
              success: { style: { background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" } },
              error: { style: { background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" } },
            }}
          />
        </QueryClientProvider>
      </body>
    </html>
  );
}
