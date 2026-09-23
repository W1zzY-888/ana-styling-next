import type { MetadataRoute } from "next";
import { absoluteSiteUrl, publicPaths } from "@/lib/seo";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPaths.map((path) => ({ url: absoluteSiteUrl(path) }));
}
