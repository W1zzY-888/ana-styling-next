import { PublicSite } from "@/components/PublicSite";
import { pageMetadata } from "@/lib/seo";
import { getPublicStudioSnapshot } from "@/lib/public-snapshot";

export const metadata = pageMetadata("Personal Styling in Miami | ANA STYLING", "Personal shopping, wardrobe consultations and styling for events, travel and photoshoots with Ana in Miami.", "personal-styling/", "en");

// Preserve an existing Wix URL so bookmarks and search links keep working.
export default async function LegacyPage() {
  return <PublicSite page="services" initialServiceGroup="Personal Styling" initialLanguage="en" initialData={await getPublicStudioSnapshot()} />;
}
