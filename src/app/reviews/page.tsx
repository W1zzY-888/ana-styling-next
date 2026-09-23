import { PublicSite } from "@/components/PublicSite";
import { pageMetadata } from "@/lib/seo";
import { getPublicStudioSnapshot } from "@/lib/public-snapshot";

export const metadata = pageMetadata("Client Reviews | ANA STYLING", "Read client reviews of Ana’s personal styling services and share your experience.", "reviews/");

export default async function ReviewsPage() {
  return <PublicSite page="reviews" initialData={await getPublicStudioSnapshot()} />;
}
