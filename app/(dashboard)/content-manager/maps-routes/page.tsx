import { MapsRoutesPanel } from "@/components/content-manager/maps-routes-panel";
import { ContentNoMuseumState } from "@/components/content-manager/no-museum-empty-state";
import { getMapList, getRouteList } from "@/services/content-manager/maps-routes.service";
import { resolveActiveMuseumId } from "@/services/content-manager/museum-context";

export default async function MapsRoutesPage() {
  const museumId = await resolveActiveMuseumId();
  if (museumId == null) {
    return <ContentNoMuseumState />;
  }

  const [maps, routes] = await Promise.all([
    getMapList(museumId),
    getRouteList(museumId),
  ]);

  return <MapsRoutesPanel maps={maps} routes={routes} museumId={museumId} />;
}
