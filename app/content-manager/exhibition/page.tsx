import { ExhibitionPageContent } from "@/components/shared/exhibition-page";
import { getExhibitions } from "@/services/exhibition.service";

export default async function ExhibitionPage() {
  const exhibitions = await getExhibitions();
  return <ExhibitionPageContent exhibitions={exhibitions} />;
}
