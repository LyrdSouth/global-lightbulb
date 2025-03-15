import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Global Lightbulb - Toggle the Light for Everyone!",
  description: "A fun interactive website where users can toggle a lightbulb on and off, with the state being shared globally across all users.",
  keywords: ["lightbulb", "interactive", "real-time", "supabase", "nextjs"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
