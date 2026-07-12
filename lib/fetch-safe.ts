import { AppError } from "@/lib/validation";

export async function safeFetch<T>(
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const isExpected =
      error instanceof AppError &&
      (error.statusCode === 404 || error.statusCode === 401);
    if (!isExpected) {
      console.error("[API]", error);
    }
    return fallback;
  }
}
