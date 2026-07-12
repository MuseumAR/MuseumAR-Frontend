export const dashboardTheme = {
  bg: "#F7F2E9",
  surface: "#FFFDF8",
  sidebar: "#FDF8EF",
  primary: "#C89B45",
  primaryDark: "#9A6F1F",
  text: "#2B1D0E",
  muted: "#6D5A45",
  mutedLight: "#A08060",
  border: "#E6D7B8",
  success: "#4F7D4A",
  danger: "#B45309",
} as const;

/** Single UI font — Be Vietnam Pro (Vietnamese + Latin) */
export const sans =
  "var(--font-be-vietnam), system-ui, sans-serif";

/**
 * @deprecated Alias of `sans` — kept so existing imports stay in sync.
 * Do not reintroduce Cinzel here (no Vietnamese glyphs).
 */
export const cinzel = sans;
