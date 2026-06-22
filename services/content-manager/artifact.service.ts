import type { ExhibitDto, CreateExhibitDto } from "@/types/api";
import type { Artifact, ArtifactRow, ArtifactStats } from "@/types";
import { DEFAULT_MUSEUM_ID } from "@/lib/constants";
import { safeFetch } from "@/lib/fetch-safe";
import {
  createExhibit,
  deleteExhibit,
  getExhibitById as fetchExhibitById,
  getExhibits,
  publishExhibit,
  unpublishExhibit,
  updateExhibit,
} from "./content-api.service";

function getPrimaryTranslation(exhibit: ExhibitDto) {
  return exhibit.translations[0];
}

function mapExhibitStatus(status: string): Artifact["status"] {
  if (status === "Published") return "Published";
  if (status === "Draft") return "Draft";
  return "Pending";
}

function mapExhibitToArtifact(exhibit: ExhibitDto): Artifact {
  const translation = getPrimaryTranslation(exhibit);

  return {
    id: exhibit.exhibitCode ?? `EX-${exhibit.id}`,
    exhibitId: exhibit.id,
    name: translation?.title ?? `Exhibit ${exhibit.id}`,
    arModel: exhibit.arOverlayUrl ?? "—",
    status: mapExhibitStatus(exhibit.status),
    category: exhibit.categoryId ? `Category ${exhibit.categoryId}` : "—",
    era: "—",
    location: `Museum ${exhibit.museumId}`,
    qrLinked: exhibit.qrCodeData ? "Active" : "Inactive",
    arModelStatus: exhibit.arOverlayUrl ? "Active" : "Inactive",
    audio: translation?.audioUrl ? "Active" : "Inactive",
    image: exhibit.thumbnailUrl ?? null,
    description: translation?.description ?? "",
  };
}

function mapExhibitToRow(exhibit: ExhibitDto, index: number): ArtifactRow {
  const translation = getPrimaryTranslation(exhibit);
  const base = 1000 * (10 - index);

  return {
    id: exhibit.id,
    name: translation?.title ?? `Exhibit ${exhibit.id}`,
    category: exhibit.categoryId ? `Category ${exhibit.categoryId}` : "—",
    era: "—",
    status:
      exhibit.status === "Published"
        ? "Published"
        : exhibit.status === "Draft"
          ? "Draft"
          : "Archived",
    image: exhibit.thumbnailUrl ?? null,
    view: base,
    audioPlay: base,
    qrScan: base,
    arUsage: base,
  };
}

export async function getArtifactById(id: string): Promise<Artifact | null> {
  const numericId = Number(id.replace(/^EX-/i, ""));
  if (Number.isNaN(numericId)) {
    const exhibits = await getExhibits(DEFAULT_MUSEUM_ID);
    const exhibit = exhibits.find(
      (item) => item.exhibitCode === id || String(item.id) === id,
    );
    return exhibit ? mapExhibitToArtifact(exhibit) : null;
  }

  try {
    const exhibit = await fetchExhibitById(numericId);
    return mapExhibitToArtifact(exhibit);
  } catch {
    return null;
  }
}

export async function getArtifacts(museumId = DEFAULT_MUSEUM_ID): Promise<Artifact[]> {
  return safeFetch(async () => {
    const exhibits = await getExhibits(museumId);
    return exhibits.map(mapExhibitToArtifact);
  }, []);
}

export async function getArtifactRows(museumId = DEFAULT_MUSEUM_ID): Promise<ArtifactRow[]> {
  return safeFetch(async () => {
    const exhibits = await getExhibits(museumId);
    return exhibits.map(mapExhibitToRow);
  }, []);
}

export async function getArtifactStats(museumId = DEFAULT_MUSEUM_ID): Promise<ArtifactStats> {
  return safeFetch(async () => {
    const exhibits = await getExhibits(museumId);

    return {
      arModelsAvailable: exhibits.filter((item) => item.arOverlayUrl).length,
      totalArtifact: exhibits.length,
      visitorsScannedToday: 0,
      qrScansToday: exhibits.filter((item) => item.qrCodeData).length,
    };
  }, {
    arModelsAvailable: 0,
    totalArtifact: 0,
    visitorsScannedToday: 0,
    qrScansToday: 0,
  });
}

export {
  createExhibit,
  updateExhibit,
  deleteExhibit,
  publishExhibit,
  unpublishExhibit,
};
export type { CreateExhibitDto };
