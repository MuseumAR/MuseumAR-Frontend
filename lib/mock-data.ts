export type ArtifactRow = {
  id: number;
  name: string;
  view: number;
  audioPlay: number;
  qrScan: number;
  arUsage: number;
};

export const ARTIFACT_STATS = {
  arModelsAvailable: 0,
  totalArtifact: 0,
  visitorsScannedToday: 0,
};

export const ARTIFACT_TABLE_DATA: ArtifactRow[] = [
  {
    id: 1,
    name: "Ancient Egyptian Sarcophagus",
    view: 10000,
    audioPlay: 10000,
    qrScan: 10000,
    arUsage: 10000,
  },
  {
    id: 2,
    name: "The Sovereign's Whisper",
    view: 9000,
    audioPlay: 9000,
    qrScan: 9000,
    arUsage: 9000,
  },
  {
    id: 3,
    name: "The Celestial Compass",
    view: 8000,
    audioPlay: 8000,
    qrScan: 8000,
    arUsage: 8000,
  },
  {
    id: 4,
    name: "The Alchemist's Secret",
    view: 7000,
    audioPlay: 7000,
    qrScan: 7000,
    arUsage: 7000,
  },
  {
    id: 5,
    name: "The Oracle's Gaze",
    view: 6000,
    audioPlay: 6000,
    qrScan: 6000,
    arUsage: 6000,
  },
  {
    id: 6,
    name: "The Timekeeper's Legacy",
    view: 5000,
    audioPlay: 5000,
    qrScan: 5000,
    arUsage: 5000,
  },
  {
    id: 7,
    name: "The Guardian's Oath",
    view: 4000,
    audioPlay: 4000,
    qrScan: 4000,
    arUsage: 4000,
  },
  {
    id: 8,
    name: "The Dreamer's Canvas",
    view: 3000,
    audioPlay: 3000,
    qrScan: 3000,
    arUsage: 3000,
  },
  {
    id: 9,
    name: "The Philosopher's Stone",
    view: 2000,
    audioPlay: 2000,
    qrScan: 2000,
    arUsage: 2000,
  },
  {
    id: 10,
    name: "The Voyager's Map",
    view: 1000,
    audioPlay: 1000,
    qrScan: 1000,
    arUsage: 1000,
  },
];
