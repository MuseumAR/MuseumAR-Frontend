import type { Artifact, ArtifactRow, ArtifactStats } from "@/types";

const MOCK_ARTIFACTS: Artifact[] = [
  {
    id: "ART-00124",
    name: "Ancient Egyptian Sarcophagus",
    arModel: "sarcophagus.glb",
    status: "Pending",
    category: "Ancient Relic",
    era: "Ancient Egypt",
    location: "Room A - Floor 2",
    qrLinked: "Active",
    arModelStatus: "Active",
    audio: "Active",
    image: null,
    description:
      "An ancient Egyptian sarcophagus used for burial practices among nobles and high-ranking individuals. Decorated with symbolic carvings and inscriptions, it reflects beliefs about the afterlife and spiritual protection in ancient Egyptian culture.",
  },
  {
    id: "ART-00125",
    name: "Ancient Guardian Statue",
    arModel: "guardian.glb",
    status: "Pending",
    category: "Religious Sculpture",
    era: "14th – 16th Century",
    location: "Room A - Floor 2",
    qrLinked: "Active",
    arModelStatus: "Inactive",
    audio: "Inactive",
    image: null,
    description:
      "A religious sculpture depicting a guardian deity, crafted during the 14th to 16th century. Used in ceremonial contexts to ward off evil spirits and protect sacred spaces.",
  },
  {
    id: "ART-00126",
    name: "The Celestial Compass",
    arModel: "compass.glb",
    status: "Published",
    category: "Navigation Tool",
    era: "18th Century",
    location: "Room B - Floor 1",
    qrLinked: "Active",
    arModelStatus: "Active",
    audio: "Active",
    image: null,
    description:
      "An 18th century navigational instrument used by explorers and sailors to determine direction using celestial bodies. A testament to the ingenuity of early maritime science.",
  },
];

const MOCK_ARTIFACT_ROWS: ArtifactRow[] = [
  { id: 1, name: "Ancient Egyptian Sarcophagus", view: 10000, audioPlay: 10000, qrScan: 10000, arUsage: 10000 },
  { id: 2, name: "The Sovereign's Whisper", view: 9000, audioPlay: 9000, qrScan: 9000, arUsage: 9000 },
  { id: 3, name: "The Celestial Compass", view: 8000, audioPlay: 8000, qrScan: 8000, arUsage: 8000 },
  { id: 4, name: "The Alchemist's Secret", view: 7000, audioPlay: 7000, qrScan: 7000, arUsage: 7000 },
  { id: 5, name: "The Oracle's Gaze", view: 6000, audioPlay: 6000, qrScan: 6000, arUsage: 6000 },
  { id: 6, name: "The Timekeeper's Legacy", view: 5000, audioPlay: 5000, qrScan: 5000, arUsage: 5000 },
  { id: 7, name: "The Guardian's Oath", view: 4000, audioPlay: 4000, qrScan: 4000, arUsage: 4000 },
  { id: 8, name: "The Dreamer's Canvas", view: 3000, audioPlay: 3000, qrScan: 3000, arUsage: 3000 },
  { id: 9, name: "The Philosopher's Stone", view: 2000, audioPlay: 2000, qrScan: 2000, arUsage: 2000 },
  { id: 10, name: "The Voyager's Map", view: 1000, audioPlay: 1000, qrScan: 1000, arUsage: 1000 },
];

const MOCK_ARTIFACT_STATS: ArtifactStats = {
  arModelsAvailable: 12,
  totalArtifact: 38,
  visitorsScannedToday: 240,
};

export async function getArtifactById(id: string): Promise<Artifact | null> {
  // TODO: replace with real API call
  // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/artifacts/${id}`);
  // return res.json();
  return MOCK_ARTIFACTS.find((a) => a.id === id) ?? null;
}

export async function getArtifacts(): Promise<Artifact[]> {
  // TODO: replace with real API call
  // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/artifacts`);
  // return res.json();
  return MOCK_ARTIFACTS;
}

export async function getArtifactRows(): Promise<ArtifactRow[]> {
  // TODO: replace with real API call
  // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/artifacts/stats`);
  // return res.json();
  return MOCK_ARTIFACT_ROWS;
}

export async function getArtifactStats(): Promise<ArtifactStats> {
  // TODO: replace with real API call
  // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/artifacts/overview`);
  // return res.json();
  return MOCK_ARTIFACT_STATS;
}
