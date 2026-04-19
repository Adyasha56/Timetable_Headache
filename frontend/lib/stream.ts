"use client";

import { API_BASE_URL } from "@/lib/constants";
import { getToken } from "@/lib/auth";

export async function streamSse(
  path: string,
  onEvent: (event: { type: string; data: unknown }) => void,
) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!response.ok || !response.body) {
    let message = "Unable to stream status";
    try {
      const body = (await response.json()) as { error?: { message?: string } };
      message = body.error?.message ?? message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    for (const block of events) {
      const type = block
        .split("\n")
        .find((line) => line.startsWith("event:"))
        ?.replace("event:", "")
        .trim();
      const raw = block
        .split("\n")
        .find((line) => line.startsWith("data:"))
        ?.replace("data:", "")
        .trim();
      if (!type || !raw) continue;
      try {
        onEvent({ type, data: JSON.parse(raw) });
      } catch {
        onEvent({ type, data: raw });
      }
    }
  }
}
