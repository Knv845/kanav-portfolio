import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree, IBM_Plex_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

// Stand-ins for Clash Display and Cabinet Grotesk (Fontshare), which globals.css still prefers when installed
const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
});

const body = Figtree({
  variable: "--font-body",
  subsets: ["latin"],
});

const serif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

// Code, requests and data in the landing story
const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Kanav Khera · Applied AI Engineer",
  description:
    "Kanav Khera, mobile full-stack engineer: follow one tap from a React Native app to the server, through rate limiting and scaling, then try his apps live.",
};

export const viewport: Viewport = {
  themeColor: "#0f1622",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${serif.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
