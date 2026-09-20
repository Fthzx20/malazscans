import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "../providers/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://malazscans.com'),
  title: {
    default: "Malaz Scans — Light Novel Translation",
    template: "%s | Malaz Scans",
  },
  description: "Curated light novel translation platform featuring a dark brutalist aesthetic, personal bookshelf, real-time reading history, and distraction-free zen reader.",
  keywords: ["light novel", "web novel", "novel translation", "read light novel", "malaz scans", "malazbaca", "japanese light novel"],
  authors: [{ name: "Malaz TL" }],
  creator: "Malaz TL",
  publisher: "Malaz Scans",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Malaz Scans",
    title: "Malaz Scans — Light Novel Translation Platform",
    description: "Curated light novel translation platform with a dark brutalist aesthetic, personal bookshelf, and immersive reading experience.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Malaz Scans — Light Novel Translation Platform",
    description: "Curated light novel translation platform with a dark brutalist aesthetic, personal bookshelf, and immersive reading experience.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0A0A0A] text-[#FAFAFA]">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
