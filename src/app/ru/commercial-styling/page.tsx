import { PublicSite } from "@/components/PublicSite";
import { pageMetadata } from "@/lib/seo";
import { getPublicStudioSnapshot } from "@/lib/public-snapshot";

export const metadata = pageMetadata("Коммерческий стайлинг | ANA STYLING", "Стайлинг модных съёмок, лукбуков и рекламных кампаний. Обсудите ваш проект с Ana.", "ru/commercial-styling/", "ru");

// Preserve an existing Wix URL so bookmarks and search links keep working.
export default async function LegacyPage() {
  return <PublicSite page="services" initialServiceGroup="Commercial Styling" initialLanguage="ru" initialData={await getPublicStudioSnapshot()} />;
}
