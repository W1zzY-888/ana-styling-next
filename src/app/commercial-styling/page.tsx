import { PublicSite } from "@/components/PublicSite";
import { pageMetadata } from "@/lib/seo";
import { getPublicStudioSnapshot } from "@/lib/public-snapshot";

export const metadata = pageMetadata("Commercial & Editorial Styling | ANA STYLING", "Fashion editorial, lookbook and brand campaign styling by Ana. Get in touch to discuss your next project.", "commercial-styling/", "en");

// Preserve an existing Wix URL so bookmarks and search links keep working.
export default async function LegacyPage() {
  return <PublicSite page="services" initialServiceGroup="Commercial Styling" initialLanguage="en" initialData={await getPublicStudioSnapshot()} />;
}
