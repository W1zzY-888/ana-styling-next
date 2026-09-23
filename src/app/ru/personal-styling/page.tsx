import { PublicSite } from "@/components/PublicSite";
import { pageMetadata } from "@/lib/seo";
import { getPublicStudioSnapshot } from "@/lib/public-snapshot";

export const metadata = pageMetadata("Персональный стайлинг в Майами | ANA STYLING", "Шопинг-сопровождение, консультации по гардеробу и образы для мероприятий, путешествий и фотосессий с Ana.", "ru/personal-styling/", "ru");

// Preserve an existing Wix URL so bookmarks and search links keep working.
export default async function LegacyPage() {
  return <PublicSite page="services" initialServiceGroup="Personal Styling" initialLanguage="ru" initialData={await getPublicStudioSnapshot()} />;
}
