import { PublicSite } from "@/components/PublicSite";
import { pageMetadata } from "@/lib/seo";
import { getPublicStudioSnapshot } from "@/lib/public-snapshot";

export const metadata = pageMetadata("Personal & Commercial Styling Services | ANA STYLING", "Explore personal shopping, wardrobe styling, photoshoot styling, editorial styling and brand campaigns with Ana in Miami.", "services/");

export default async function ServicesPage() {
  return <PublicSite page="services" initialData={await getPublicStudioSnapshot()} />;
}
