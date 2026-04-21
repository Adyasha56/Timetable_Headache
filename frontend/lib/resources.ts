export type FieldType = "text" | "number" | "date" | "textarea" | "select";

export type FieldDef = {
  key: string;
  label: string;
  type?: FieldType;
  placeholder?: string;
  helpText?: string;
  // For remote select fields: fetch options from this endpoint
  optionsEndpoint?: string;
  optionLabel?: string;  // which property to display as label
  optionValue?: string;  // which property to use as value (defaults to "_id")
  // Option label formatter: combine multiple fields (e.g. "2026 Sem 1")
  optionLabelFormat?: (item: Record<string, unknown>) => string;
  // For static select fields: inline options list
  options?: Array<{ label: string; value: string }>;
};

export type ResourceConfig = {
  title: string;
  description: string;
  endpoint: string;
  queryHints?: Record<string, string | number>;
  fields: FieldDef[];
  emptyMessage?: string;
  displayColumns?: Array<{ key: string; label: string }>;
};

export const resources: Record<string, ResourceConfig> = {
  departments: {
    title: "Departments",
    description: "Academic departments in your institution (e.g. Computer Science, Mathematics). Add departments before adding faculty or subjects.",
    endpoint: "/departments",
    emptyMessage: "No departments added yet. Use the form above to add your first department.",
    fields: [
      { key: "code", label: "Department Code", placeholder: "CSE" },
      { key: "name", label: "Department Name", placeholder: "Computer Science Engineering" },
      { key: "room_group", label: "Room Group", placeholder: "Block A", helpText: "Building or block where this department's classrooms are located." },
    ],
    displayColumns: [
      { key: "code", label: "Code" },
      { key: "name", label: "Name" },
      { key: "room_group", label: "Room Group" },
    ],
  },

  users: {
    title: "Users",
    description: "System accounts for administrators, HODs, faculty, and staff. Each user can log in and perform actions based on their role.",
    endpoint: "/users",
    emptyMessage: "No users created yet.",
    fields: [
      { key: "name", label: "Full Name", placeholder: "Dr. Rajesh Sharma" },
      { key: "email", label: "Email Address", placeholder: "rajesh@institution.edu" },
      { key: "password", label: "Password", type: "text", placeholder: "Temporary password" },
      {
        key: "role",
        label: "Role",
        type: "select",
        options: [
          { label: "Admin", value: "admin" },
          { label: "HOD", value: "hod" },
          { label: "Faculty", value: "faculty" },
          { label: "Staff", value: "staff" },
        ],
        placeholder: "Select role",
      },
      {
        key: "dept_id",
        label: "Department",
        type: "select",
        optionsEndpoint: "/departments",
        optionLabel: "name",
        placeholder: "Select department",
      },
    ],
    displayColumns: [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "role", label: "Role" },
      { key: "dept_id", label: "Department" },
    ],
  },

  faculty: {
    title: "Faculty Members",
    description: "Teaching staff who will be assigned to classes. Faculty must belong to a department and will be scheduled by the timetable optimizer.",
    endpoint: "/faculty",
    emptyMessage: "No faculty added yet. Add faculty members using the form above.",
    fields: [
      { key: "name", label: "Full Name", placeholder: "Dr. Priya Nair" },
      {
        key: "dept_id",
        label: "Department",
        type: "select",
        optionsEndpoint: "/departments",
        optionLabel: "name",
        placeholder: "Select department",
      },
      {
        key: "type",
        label: "Faculty Type",
        type: "select",
        options: [
          { label: "Faculty", value: "faculty" },
          { label: "Lab Assistant", value: "lab_assistant" },
          { label: "Visiting Faculty", value: "visiting" },
        ],
        placeholder: "Select type",
      },
      {
        key: "max_hours_per_week",
        label: "Max Hours / Week",
        type: "number",
        placeholder: "20",
        helpText: "Maximum number of teaching periods this faculty can have per week.",
      },
    ],
    displayColumns: [
      { key: "name", label: "Name" },
      { key: "dept_id", label: "Department" },
      { key: "type", label: "Type" },
      { key: "max_hours_per_week", label: "Max Hrs/Wk" },
      { key: "status", label: "Status" },
    ],
  },

  subjects: {
    title: "Subjects",
    description: "Courses or papers taught each semester. Each subject specifies how many sessions per week are needed and what type of room is required.",
    endpoint: "/subjects",
    emptyMessage: "No subjects added yet. Add subjects before generating a timetable.",
    fields: [
      { key: "code", label: "Subject Code", placeholder: "CS201" },
      { key: "name", label: "Subject Name", placeholder: "Data Structures" },
      {
        key: "dept_id",
        label: "Department",
        type: "select",
        optionsEndpoint: "/departments",
        optionLabel: "name",
        placeholder: "Select department",
      },
      {
        key: "type",
        label: "Subject Type",
        type: "select",
        options: [
          { label: "Theory", value: "theory" },
          { label: "Lab", value: "lab" },
          { label: "Tutorial", value: "tutorial" },
        ],
        placeholder: "Select type",
      },
      {
        key: "credits",
        label: "Credits",
        type: "number",
        placeholder: "3",
      },
      {
        key: "sessions_per_week",
        label: "Sessions per Week",
        type: "number",
        placeholder: "3",
        helpText: "How many class periods this subject needs per week. A 3-credit theory subject typically needs 3 sessions.",
      },
      {
        key: "room_type_required",
        label: "Room Type Required",
        type: "select",
        options: [
          { label: "Classroom", value: "classroom" },
          { label: "Lab", value: "lab" },
          { label: "Seminar Hall", value: "seminar_hall" },
          { label: "Auditorium", value: "auditorium" },
        ],
        placeholder: "Select room type",
      },
    ],
    displayColumns: [
      { key: "code", label: "Code" },
      { key: "name", label: "Name" },
      { key: "dept_id", label: "Department" },
      { key: "type", label: "Type" },
      { key: "sessions_per_week", label: "Sessions/Wk" },
    ],
  },

  rooms: {
    title: "Rooms",
    description: "Classrooms, labs, and halls available for scheduling. Rooms are assigned to sessions based on their type and capacity.",
    endpoint: "/rooms",
    emptyMessage: "No rooms added yet. Add at least one room before generating a timetable.",
    fields: [
      { key: "name", label: "Room Name / Number", placeholder: "Room 311" },
      {
        key: "type",
        label: "Room Type",
        type: "select",
        options: [
          { label: "Classroom", value: "classroom" },
          { label: "Lab", value: "lab" },
          { label: "Seminar Hall", value: "seminar_hall" },
          { label: "Auditorium", value: "auditorium" },
        ],
        placeholder: "Select type",
      },
      {
        key: "capacity",
        label: "Capacity",
        type: "number",
        placeholder: "60",
        helpText: "Maximum number of students this room can seat.",
      },
      {
        key: "dept_id",
        label: "Department (owner)",
        type: "select",
        optionsEndpoint: "/departments",
        optionLabel: "name",
        placeholder: "Select department",
      },
    ],
    displayColumns: [
      { key: "name", label: "Room" },
      { key: "type", label: "Type" },
      { key: "capacity", label: "Capacity" },
      { key: "dept_id", label: "Department" },
    ],
  },

  sections: {
    title: "Sections",
    description: "Sub-groups within a department for a given semester (e.g. Section A, Section B). Sections allow generating separate timetables for different student batches.",
    endpoint: "/sections",
    emptyMessage: "No sections added. Sections are optional — skip this if you don't split students into batches.",
    fields: [
      { key: "name", label: "Section Name", placeholder: "A" },
      {
        key: "dept_id",
        label: "Department",
        type: "select",
        optionsEndpoint: "/departments",
        optionLabel: "name",
        placeholder: "Select department",
      },
      {
        key: "semester",
        label: "Semester",
        type: "select",
        options: [
          { label: "Semester 1", value: "1" },
          { label: "Semester 2", value: "2" },
          { label: "Semester 3", value: "3" },
          { label: "Semester 4", value: "4" },
          { label: "Semester 5", value: "5" },
          { label: "Semester 6", value: "6" },
          { label: "Semester 7", value: "7" },
          { label: "Semester 8", value: "8" },
        ],
        placeholder: "Select semester",
      },
      {
        key: "year",
        label: "Year of Study",
        type: "select",
        options: [
          { label: "1st Year", value: "1" },
          { label: "2nd Year", value: "2" },
          { label: "3rd Year", value: "3" },
          { label: "4th Year", value: "4" },
        ],
        placeholder: "Select year",
      },
      { key: "strength", label: "Student Strength", type: "number", placeholder: "60" },
    ],
    displayColumns: [
      { key: "name", label: "Section" },
      { key: "dept_id", label: "Department" },
      { key: "semester", label: "Semester" },
      { key: "year", label: "Year" },
      { key: "strength", label: "Strength" },
    ],
  },

  calendars: {
    title: "Academic Calendar",
    description: "Define the semester periods for your institution. At least one calendar is required before generating a timetable.",
    endpoint: "/calendars",
    emptyMessage: "No academic calendar added. Create a semester calendar first.",
    fields: [
      { key: "year", label: "Academic Year", type: "number", placeholder: "2026" },
      {
        key: "semester",
        label: "Semester",
        type: "select",
        options: [
          { label: "Odd Semester", value: "1" },
          { label: "Even Semester", value: "2" },
        ],
        placeholder: "Select semester",
      },
      { key: "start_date", label: "Start Date", type: "date" },
      { key: "end_date", label: "End Date", type: "date" },
    ],
    displayColumns: [
      { key: "year", label: "Year" },
      { key: "semester", label: "Semester" },
      { key: "start_date", label: "Start Date" },
      { key: "end_date", label: "End Date" },
    ],
  },

  constraints: {
    title: "Scheduling Constraints",
    description: "Rules that the timetable optimizer must follow. You can add constraints manually here, or use the plain-English input on the Timetables page.",
    endpoint: "/constraints",
    emptyMessage: "No constraints added. The optimizer will use default rules.",
    fields: [
      {
        key: "semester_id",
        label: "Semester",
        type: "select",
        optionsEndpoint: "/calendars",
        optionLabelFormat: (item) => `${item.year as number} — ${(item.semester as number) === 1 ? "Odd Sem" : "Even Sem"}`,
        placeholder: "Select semester",
      },
      {
        key: "dept_id",
        label: "Department",
        type: "select",
        optionsEndpoint: "/departments",
        optionLabel: "name",
        placeholder: "Select department",
      },
      {
        key: "raw_text",
        label: "Constraint Description",
        type: "textarea",
        placeholder: "e.g. Dr. Sharma is not available on Fridays",
        helpText: "Describe the rule in plain English. The system will parse it automatically.",
      },
      {
        key: "type",
        label: "Constraint Type",
        type: "select",
        options: [
          { label: "Hard (must satisfy)", value: "hard" },
          { label: "Soft (try to satisfy)", value: "soft" },
        ],
        placeholder: "Select type",
      },
      {
        key: "weight",
        label: "Priority (1–5)",
        type: "number",
        placeholder: "3",
        helpText: "Priority level for soft constraints. 5 = highest priority.",
      },
    ],
    displayColumns: [
      { key: "dept_id", label: "Department" },
      { key: "type", label: "Type" },
      { key: "raw_text", label: "Rule" },
      { key: "status", label: "Status" },
    ],
  },

  overrides: {
    title: "Daily Overrides",
    description: "Record day-to-day changes such as faculty absences, room blocks, or extra makeup classes. These don't modify the published timetable.",
    endpoint: "/overrides",
    emptyMessage: "No overrides recorded.",
    fields: [
      { key: "date", label: "Date", type: "date" },
      {
        key: "type",
        label: "Override Type",
        type: "select",
        options: [
          { label: "Teacher Absent", value: "teacher_absent" },
          { label: "Room Blocked", value: "room_blocked" },
          { label: "Extra Class", value: "extra_class" },
          { label: "Holiday", value: "holiday" },
        ],
        placeholder: "Select type",
      },
      { key: "reason", label: "Reason", placeholder: "Medical leave" },
    ],
    displayColumns: [
      { key: "date", label: "Date" },
      { key: "type", label: "Type" },
      { key: "reason", label: "Reason" },
    ],
  },

  notifications: {
    title: "Notifications",
    description: "System notifications for timetable updates, overrides, and solver events.",
    endpoint: "/notifications",
    emptyMessage: "No notifications yet.",
    fields: [],
    displayColumns: [
      { key: "title", label: "Title" },
      { key: "message", label: "Message" },
      { key: "read", label: "Read" },
      { key: "created_at", label: "Date" },
    ],
  },

  audit: {
    title: "Audit Log",
    description: "A record of all create, update, and delete actions performed by users. Used for accountability and troubleshooting.",
    endpoint: "/audit",
    emptyMessage: "No audit entries yet.",
    fields: [],
    displayColumns: [
      { key: "user_email", label: "User" },
      { key: "method", label: "Action" },
      { key: "path", label: "Endpoint" },
      { key: "status_code", label: "Status" },
      { key: "created_at", label: "Date" },
    ],
  },
};
