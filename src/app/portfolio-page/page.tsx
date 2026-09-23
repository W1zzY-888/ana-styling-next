import { PublicSite } from "@/components/PublicSite";
import { pageMetadata } from "@/lib/seo";
import { getPublicStudioSnapshot } from "@/lib/public-snapshot";

export const metadata = pageMetadata("Fashion Portfolio | ANA STYLING", "Explore cover, editorial, campaign, studio and fashion photography styled by Ana.", "portfolio/", "en");

// Preserve an existing Wix URL so bookmarks and search links keep working.
export default async function LegacyPage() {
  return <PublicSite page="portfolio" initialServiceGroup="Personal Styling" initialLanguage="en" initialData={await getPublicStudioSnapshot()} />;
}
