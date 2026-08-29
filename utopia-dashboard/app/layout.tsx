import type { Metadata } from "next";
import { Inter } from "next/font/google";
// FIX: Forced strict absolute aliases to prevent Context Duplication
import { AuthProvider } from '@/app/context/AuthContext'; 
import Sidebar from "@/app/components/sidebar"; 
import "./globals.css";

// Inter is the industry standard for clean, legible enterprise UI (used by Stripe, Vercel, etc.)
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Utopia Operations | SOC Dashboard",
  description: "Enterprise Security Operations Center and Audit Management",
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
          {/* Enterprise Shell: Slate background automatically inherits from globals.css */}
          <div className="flex min-h-screen">
            <Sidebar />
            
            {/* 
              * Main Content Area 
              * ml-64 pushes content past the fixed 16rem sidebar.
              * We use flex-col to ensure all sub-pages stretch and align perfectly.
              */}
            <main className="flex-1 ml-64 flex flex-col">
              <div className="flex-1 p-8 lg:p-10 max-w-[1600px] mx-auto w-full">
                {children}
              </div>
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}