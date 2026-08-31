import type { Metadata } from "next";
import { Bebas_Neue, Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin", "cyrillic"],
});

const displayFont = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
});

const condensedFont = Bebas_Neue({
  variable: "--font-condensed",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Ana Styling | Miami Personal Stylist",
  description: "Premium personal styling, wardrobe edits, editorial direction, and WhatsApp booking for Ana Styling in Miami.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${displayFont.variable} ${condensedFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
