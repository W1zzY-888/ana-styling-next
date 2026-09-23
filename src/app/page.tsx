import { PublicSite } from "@/components/PublicSite";
import { pageMetadata } from "@/lib/seo";
import { getPublicStudioSnapshot } from "@/lib/public-snapshot";

export const metadata = pageMetadata("ANA STYLING | Personal & Fashion Stylist in Miami", "Personal styling, wardrobe consultations, personal shopping and commercial styling in Miami. Discover Ana’s portfolio and book a styling consultation.", "");

export default async function Home() {
  return <PublicSite page="home" initialData={await getPublicStudioSnapshot()} />;
}
