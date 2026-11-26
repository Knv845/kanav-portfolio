import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree, Instrument_Serif } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Kanav Khera · Applied AI Engineer",
  description:
    "Kanav Khera's portfolio: a crane claw lifts shipping containers out of a pile and swings their doors open to show apps, career history and tools.",
};

export const viewport: Viewport = {
  themeColor: "#0f1622",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
