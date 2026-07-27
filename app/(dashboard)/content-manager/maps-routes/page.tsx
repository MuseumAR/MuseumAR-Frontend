import { MapsRoutesPanel } from "@/components/content-manager/maps-routes-panel";
import { ContentNoMuseumState } from "@/components/content-manager/no-museum-empty-state";
import { getMapList, getRouteList } from "@/services/content-manager/maps-routes.service";
import { resolveActiveMuseumId } from "@/services/content-manager/museum-context";
import { getMuseumProfileEntry } from "@/services/admin";
import { getExhibitions, getExhibits, getAgeGroups } from "@/services/content-manager/content-api.service";

export default async function MapsRoutesPage() {
  const [maps, routes, museumIdFromJwt, museum, exhibitions, ageGroups, exhibits] =
    await Promise.all([
      getMapList(),
      getRouteList(),
      resolveActiveMuseumId(),
      getMuseumProfileEntry(),
      getExhibitions().catch(() => []),
      getAgeGroups().catch(() => []),
      getExhibits().catch(() => []),
    ]);
  const museumId = museumIdFromJwt ?? museum?.id ?? null;
  if (museumId == null) {
    return <ContentNoMuseumState />;
  }

  return (
    <MapsRoutesPanel
      maps={maps}
      routes={routes}
      museumId={museumId}
      exhibitions={exhibitions}
      ageGroups={ageGroups}
      exhibits={exhibits}
    />
  );
}
