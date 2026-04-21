export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Slot 5 (13:00–14:00) is blocked as lunch in all rooms
export const LUNCH_SLOT = 5;

export const SLOTS = [
  { label: "08:00–09:00", start: "08:00" },
  { label: "09:00–10:00", start: "09:00" },
  { label: "10:00–11:00", start: "10:00" },
  { label: "11:00–12:00", start: "11:00" },
  { label: "12:00–13:00", start: "12:00" },
  { label: "13:00–14:00", start: "13:00" }, // Lunch Break
  { label: "14:00–15:00", start: "14:00" },
  { label: "15:00–16:00", start: "15:00" },
];
