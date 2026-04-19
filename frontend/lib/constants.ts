export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const SLOTS = [
  { label: "08:30–09:30", start: "08:30" },
  { label: "09:30–10:30", start: "09:30" },
  { label: "10:30–11:30", start: "10:30" },
  { label: "11:30–12:30", start: "11:30" },
  { label: "12:30–13:30", start: "12:30" },
  { label: "13:30–14:30", start: "13:30" },
  { label: "14:30–15:30", start: "14:30" },
  { label: "15:30–16:30", start: "15:30" },
];
