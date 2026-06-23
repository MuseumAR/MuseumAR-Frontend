import { getAccessToken } from "@/services/auth/auth.storage";
import { AppError } from "@/lib/validation";
import type { ApiResponse } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function getApiUrl(path: string) {
  if (!API_URL) {
    throw new AppError("NEXT_PUBLIC_API_URL is not configured");
  }

  return `${API_URL}${path}`;
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  accessToken?: string | null;
  headers?: Record<string, string>;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, accessToken, headers = {} } = options;

  const requestHeaders: Record<string, string> = {
    Accept: "application/json; charset=utf-8",
    ...headers,
  };

  if (accessToken) {
    requestHeaders.Authorization = `Bearer ${accessToken}`;
  }

  const hasJsonBody = body !== undefined && !(body instanceof FormData);
  if (hasJsonBody) {
    requestHeaders["Content-Type"] = "application/json";
  }

  const res = await fetch(getApiUrl(path), {
    method,
    headers: requestHeaders,
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });

  let json: ApiResponse<T>;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new AppError("Request failed", res.status);
  }

  if (json.statusCode !== 200) {
    throw new AppError(json.message || "Request failed", json.statusCode);
  }

  return json.data;
}

function withAuth(accessToken?: string | null) {
  return accessToken ?? getAccessToken();
}

export function apiGet<T>(path: string) {
  return request<T>(path);
}

export function apiGetAuth<T>(path: string, accessToken?: string | null) {
  const token = withAuth(accessToken);
  if (!token) throw new AppError("Not authenticated");
  return request<T>(path, { accessToken: token });
}

export function apiPost<T>(path: string, body?: unknown) {
  return request<T>(path, { method: "POST", body });
}

export function apiPostAuth<T>(
  path: string,
  body?: unknown,
  accessToken?: string | null,
) {
  const token = withAuth(accessToken);
  if (!token) throw new AppError("Not authenticated");
  return request<T>(path, { method: "POST", body, accessToken: token });
}

export function apiPutAuth<T>(
  path: string,
  body?: unknown,
  accessToken?: string | null,
) {
  const token = withAuth(accessToken);
  if (!token) throw new AppError("Not authenticated");
  return request<T>(path, { method: "PUT", body, accessToken: token });
}

export function apiDeleteAuth<T>(path: string, accessToken?: string | null) {
  const token = withAuth(accessToken);
  if (!token) throw new AppError("Not authenticated");
  return request<T>(path, { method: "DELETE", accessToken: token });
}

export function apiPostFormAuth<T>(
  path: string,
  formData: FormData,
  accessToken?: string | null,
) {
  const token = withAuth(accessToken);
  if (!token) throw new AppError("Not authenticated");
  return request<T>(path, {
    method: "POST",
    body: formData,
    accessToken: token,
  });
}

export function apiPostForm<T>(path: string, formData: FormData) {
  return request<T>(path, { method: "POST", body: formData });
}
