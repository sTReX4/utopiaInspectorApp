import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import { AuthProvider } from '@/app/context/AuthContext';
import IconProvider from '@/app/components/icon-provider';
import "./globals.css";

/*
 * Geist carries the interface. Geist Mono is reserved for data that benefits
 * from fixed advance widths: identifiers, timestamps, coordinates, licence
 * numbers. It is not a decorative voice.
 */
const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

/*
 * Newsreader is used only where the editorial register is genuinely earned:
 * the legal documents and the login wordmark. It never appears inside the
 * console, where density beats voice.
 */
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});

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
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable}`}
    >
      {/*
        * The root layout owns typography, tokens and auth only. Chrome belongs
        * to the route groups, so the login screen no longer has to break out of
        * a shell that was never meant to contain it.
        */}
      <body className="font-sans">
        <AuthProvider>
          <IconProvider>{children}</IconProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
