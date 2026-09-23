import { PublicSite } from "@/components/PublicSite";
import { pageMetadata } from "@/lib/seo";
import { getPublicStudioSnapshot } from "@/lib/public-snapshot";

export const metadata = pageMetadata("Fashion & Editorial Portfolio | ANA STYLING", "Explore Ana Styling’s cover, editorial, campaign, studio and fashion photography portfolio.", "portfolio/");

export default async function PortfolioPage() {
  return <PublicSite page="portfolio" initialData={await getPublicStudioSnapshot()} />;
}
