import { PublicSite } from "@/components/PublicSite";
import { pageMetadata } from "@/lib/seo";
import { getPublicStudioSnapshot } from "@/lib/public-snapshot";

export const metadata = pageMetadata("ANA STYLING | Персональный стилист в Майами", "Персональный стайлинг, разбор гардероба, шопинг-сопровождение и коммерческие съёмки с Ana в Майами.", "ru/", "ru");

// Preserve an existing Wix URL so bookmarks and search links keep working.
export default async function LegacyPage() {
  return <PublicSite page="home" initialServiceGroup="Personal Styling" initialLanguage="ru" initialData={await getPublicStudioSnapshot()} />;
}
