"use client";

import { API_BASE_URL } from "@/lib/constants";
import { getToken } from "@/lib/auth";

type Envelope<T> = {
  success: boolean;
  data: T;
  error: { code: string; message: string; details?: string[] } | null;
};

type QueryValue = string | number | boolean | undefined | null;

function toQueryString(query?: Record<string, QueryValue>) {
  if (!query) return "";
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = "Request failed";
    try {
      const body = (await response.json()) as Envelope<unknown>;
      message = body.error?.message ?? message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null as T;
  }
  const body = (await response.json()) as Envelope<T>;
  return body.data;
}

export const api = {
  get: <T>(path: string, query?: Record<string, QueryValue>) =>
    request<T>(`${path}${toQueryString(query)}`),
  post: <T>(path: string, payload: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(payload) }),
  patch: <T>(path: string, payload: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(payload) }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
