import { MapsRoutesPanel } from "@/components/content-manager/maps-routes-panel";
import { ContentNoMuseumState } from "@/components/content-manager/no-museum-empty-state";
import { getMapList, getRouteList } from "@/services/content-manager/maps-routes.service";
import { resolveActiveMuseumId } from "@/services/content-manager/museum-context";
import { getMuseumProfileEntry } from "@/services/admin";

export default async function MapsRoutesPage() {
  const [maps, routes, museumIdFromJwt, museum] = await Promise.all([
    getMapList(),
    getRouteList(),
    resolveActiveMuseumId(),
    getMuseumProfileEntry(),
  ]);
  const museumId = museumIdFromJwt ?? museum?.id ?? null;
  if (museumId == null) {
    return <ContentNoMuseumState />;
  }

  return <MapsRoutesPanel maps={maps} routes={routes} museumId={museumId} />;
}
