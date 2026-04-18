export type FieldType = "text" | "number" | "date" | "textarea";

export type ResourceConfig = {
  title: string;
  endpoint: string;
  queryHints?: Record<string, string | number>;
  fields: Array<{ key: string; label: string; type?: FieldType; placeholder?: string }>;
};

export const resources: Record<string, ResourceConfig> = {
  departments: {
    title: "Departments",
    endpoint: "/departments",
    fields: [
      { key: "code", label: "Code", placeholder: "CSE" },
      { key: "name", label: "Name", placeholder: "Computer Science" },
      { key: "room_group", label: "Room Group", placeholder: "Block A" },
    ],
  },
  users: {
    title: "Users",
    endpoint: "/users",
    fields: [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "password", label: "Password" },
      { key: "role", label: "Role" },
      { key: "dept_id", label: "Department Id" },
    ],
  },
  faculty: {
    title: "Faculty",
    endpoint: "/faculty",
    fields: [
      { key: "user_id", label: "User Id" },
      { key: "name", label: "Name" },
      { key: "dept_id", label: "Department Id" },
      { key: "type", label: "Type", placeholder: "faculty" },
      { key: "max_hours_per_week", label: "Max Hours", type: "number" },
    ],
  },
  subjects: {
    title: "Subjects",
    endpoint: "/subjects",
    fields: [
      { key: "code", label: "Code" },
      { key: "name", label: "Name" },
      { key: "dept_id", label: "Department Id" },
      { key: "type", label: "Type", placeholder: "theory|lab|tutorial" },
      { key: "credits", label: "Credits", type: "number" },
      { key: "sessions_per_week", label: "Sessions/Week", type: "number" },
    ],
  },
  rooms: {
    title: "Rooms",
    endpoint: "/rooms",
    fields: [
      { key: "name", label: "Name" },
      { key: "type", label: "Type", placeholder: "classroom|lab" },
      { key: "capacity", label: "Capacity", type: "number" },
      { key: "dept_id", label: "Department Id" },
    ],
  },
  sections: {
    title: "Sections",
    endpoint: "/sections",
    fields: [
      { key: "name", label: "Name", placeholder: "A / Genius" },
      { key: "dept_id", label: "Department Id" },
      { key: "semester_id", label: "Semester Id" },
      { key: "year", label: "Year", type: "number" },
      { key: "strength", label: "Strength", type: "number" },
    ],
  },
  calendars: {
    title: "Calendars",
    endpoint: "/calendars",
    fields: [
      { key: "year", label: "Year", type: "number" },
      { key: "semester", label: "Semester", type: "number" },
      { key: "start_date", label: "Start Date", type: "date" },
      { key: "end_date", label: "End Date", type: "date" },
    ],
  },
  constraints: {
    title: "Constraints",
    endpoint: "/constraints",
    fields: [
      { key: "semester_id", label: "Semester Id" },
      { key: "dept_id", label: "Department Id" },
      { key: "raw_text", label: "Rule Text", type: "textarea" },
      { key: "type", label: "Type", placeholder: "hard|soft" },
      { key: "weight", label: "Weight", type: "number" },
    ],
  },
  overrides: {
    title: "Overrides",
    endpoint: "/overrides",
    fields: [{ key: "date", label: "Date", type: "date" }],
  },
  notifications: {
    title: "Notifications",
    endpoint: "/notifications",
    fields: [],
  },
  audit: {
    title: "Audit Log",
    endpoint: "/audit",
    fields: [],
  },
};
