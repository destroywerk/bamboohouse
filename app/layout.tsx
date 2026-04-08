import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bamboo House Radio",
  description: "A monthly ambient radio show on Music Box Radio UK. Curated by Tim Green and Martyn Riley.",
  openGraph: {
    title: "Bamboo House Radio",
    description: "A monthly ambient radio show on Music Box Radio UK.",
    url: "https://bamboohouseradio.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistMono.variable} antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
