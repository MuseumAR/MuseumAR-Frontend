import { AppError } from "@/lib/validation";

export async function safeFetch<T>(
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const isExpectedNotFound =
      error instanceof AppError && error.statusCode === 404;
    if (!isExpectedNotFound) {
      console.error("[API]", error);
    }
    return fallback;
  }
}
