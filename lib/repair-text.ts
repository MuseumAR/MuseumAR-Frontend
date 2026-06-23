/** Fix UTF-8 text that was misread as Latin-1 (e.g. "HÃ Ná»™i" → "Hà Nội"). */
export function repairDisplayText(value: string | null | undefined): string {
  if (value == null || value === "") return value ?? "";

  if (!/[\u00C0-\u00FF]/.test(value)) return value;

  try {
    const bytes = Uint8Array.from(value, (char) => char.charCodeAt(0) & 0xff);
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (decoded && decoded !== value && !decoded.includes("\uFFFD")) {
      return decoded;
    }
  } catch {
    // keep original
  }

  return value;
}

export function repairMuseumText<
  T extends {
    name?: string | null;
    city?: string | null;
    province?: string | null;
    address?: string | null;
    description?: string | null;
  },
>(museum: T): T {
  return {
    ...museum,
    name: museum.name ? repairDisplayText(museum.name) : museum.name,
    city: museum.city ? repairDisplayText(museum.city) : museum.city,
    province: museum.province ? repairDisplayText(museum.province) : museum.province,
    address: museum.address ? repairDisplayText(museum.address) : museum.address,
    description: museum.description ? repairDisplayText(museum.description) : museum.description,
  };
}
