import { ExhibitionApplicationTable } from "@/components/museum-manager/exhibition-application";
import { getExhibitionApplications } from "@/services/exhibition.service";

export default async function ExhibitionApplicationPage() {
  const applications = await getExhibitionApplications();
  return <ExhibitionApplicationTable applications={applications} />;
}
