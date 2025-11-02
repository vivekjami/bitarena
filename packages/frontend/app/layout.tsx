import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from './providers';
import { Notifications } from '@/components/Notifications';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "BitArena - Compete. Wager. Win.",
  description: "Skill-based multiplayer games with real MUSD stakes on Mezo Network",
  keywords: ["BitArena", "Gaming", "Blockchain", "MUSD", "Mezo", "Web3"],
  authors: [{ name: "BitArena Team" }],
  openGraph: {
    title: "BitArena - Compete. Wager. Win.",
    description: "Skill-based multiplayer games with real MUSD stakes",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-[#0A0A0F] text-white`}>
        <Providers>
          {children}
          <Notifications />
        </Providers>
      </body>
    </html>
  );
}
