import { MapsRoutesPanel } from "@/components/content-manager/maps-routes-panel";
import { ContentNoMuseumState } from "@/components/content-manager/no-museum-empty-state";
import { getMapList } from "@/services/content-manager/maps-routes.service";
import { getRoomList } from "@/services/content-manager/room.service";
import { resolveActiveMuseumId } from "@/services/content-manager/museum-context";
import { getMuseumProfileEntry } from "@/services/admin";

export default async function MapsRoutesPage() {
  const [maps, museumIdFromJwt, museum] = await Promise.all([
    getMapList(),
    resolveActiveMuseumId(),
    getMuseumProfileEntry(),
  ]);
  const museumId = museumIdFromJwt ?? museum?.id ?? null;
  if (museumId == null) {
    return <ContentNoMuseumState />;
  }

  const rooms = await getRoomList(museumId).catch(() => []);

  return (
    <MapsRoutesPanel
      maps={maps}
      rooms={rooms}
      museumId={museumId}
    />
  );
}
