import type { Metadata } from "next";

// Include the deployment subdirectory here until the custom domain is connected.
export const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://w1zzy-888.github.io/ana-styling-next/");
if (!siteUrl.pathname.endsWith("/")) siteUrl.pathname += "/";
export const isPreviewSite = siteUrl.hostname.endsWith(".github.io") || siteUrl.hostname === "localhost";
export const absoluteSiteUrl = (path = "") => new URL(path.replace(/^\/+/, ""), siteUrl).toString();
export const publicPaths = ["", "services/", "portfolio/", "publications/", "reviews/", "personal-styling/", "commercial-styling/", "ru/", "ru/personal-styling/", "ru/commercial-styling/", "ru/portfolio-page/"];

export function pageMetadata(title: string, description: string, path = "", language: "en" | "ru" = "en"): Metadata {
  const image = { url: absoluteSiteUrl("brand/ana-styling-share.jpg"), width: 1200, height: 630, alt: "ANA STYLING — AK monogram" };
  const languagePairs: Record<string, string> = {
    "": "ru/",
    "personal-styling/": "ru/personal-styling/",
    "commercial-styling/": "ru/commercial-styling/",
    "portfolio/": "ru/portfolio-page/",
  };
  const pair = Object.entries(languagePairs).find(([en, ru]) => path === en || path === ru);
  return {
    title,
    description,
    alternates: {
      canonical: absoluteSiteUrl(path),
      ...(pair ? { languages: { en: absoluteSiteUrl(pair[0]), ru: absoluteSiteUrl(pair[1]) } } : {}),
    },
    openGraph: {
      type: "website",
      siteName: "ANA STYLING",
      locale: language === "ru" ? "ru_RU" : "en_US",
      title,
      description,
      url: absoluteSiteUrl(path),
      images: [image],
    },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}
