import { getAuthUser } from "./auth.storage";

export function getStoredMuseumId(): number | null {
  return getAuthUser()?.museumId ?? null;
}
