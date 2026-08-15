import { AppError } from "@/lib/validation";

/** Only treat missing records as empty. Network / 500 / 401 must surface. */
export async function safeFetch<T>(
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 404) {
      return fallback;
    }
    throw error;
  }
}
