import { PublicSite } from "@/components/PublicSite";
import { pageMetadata } from "@/lib/seo";
import { getPublicStudioSnapshot } from "@/lib/public-snapshot";

export const metadata = pageMetadata("Портфолио стилиста | ANA STYLING", "Обложки, эдиториалы, рекламные кампании, студийные и модные съёмки со стайлингом Ana.", "ru/portfolio-page/", "ru");

// Preserve an existing Wix URL so bookmarks and search links keep working.
export default async function LegacyPage() {
  return <PublicSite page="portfolio" initialServiceGroup="Personal Styling" initialLanguage="ru" initialData={await getPublicStudioSnapshot()} />;
}
