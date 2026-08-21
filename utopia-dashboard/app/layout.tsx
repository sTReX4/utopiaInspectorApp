import type { Metadata } from "next";
import { Inter } from "next/font/google";
// FIX: Forced strict absolute aliases to prevent Context Duplication
import { AuthProvider } from '@/app/context/AuthContext'; 
import Sidebar from "@/app/components/sidebar"; 
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Utopia Operations Dashboard",
  description: "Security Operations Center",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}