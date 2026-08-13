/** Display API enum/status values as-is. Do not translate until a translation API exists. */
export function labelStatus(status?: string | null): string {
  if (!status) return "—";
  return status;
}
