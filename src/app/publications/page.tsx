import { PublicSite } from "@/components/PublicSite";
import { pageMetadata } from "@/lib/seo";
import { getPublicStudioSnapshot } from "@/lib/public-snapshot";

export const metadata = pageMetadata("Publications & Magazine Covers | ANA STYLING", "Discover magazine covers and fashion publications featuring styling by Ana.", "publications/");

export default async function PublicationsPage() {
  return <PublicSite page="publications" initialData={await getPublicStudioSnapshot()} />;
}
