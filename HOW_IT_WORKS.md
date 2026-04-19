# Headache Solver — How It Works

## What This System Does

Think of it like **automated exam duty scheduling**, but for the entire semester timetable. Instead of a HOD spending days fitting subjects, faculty, and rooms into a grid manually — this system does it in seconds, automatically, while respecting every constraint (faculty leaves, room types, max teaching hours, etc.).

---

## The Three Parts (Like a Restaurant)

```
┌─────────────────────────────────────────────────────────┐
│   FRONTEND (Next.js)                                    │
│   The Menu & Dining Area                                │
│   — What the admin/faculty sees and clicks              │
├─────────────────────────────────────────────────────────┤
│   BACKEND (Node.js / Express)                           │
│   The Waiter & Kitchen Manager                          │
│   — Takes orders, talks to database, sends jobs         │
├─────────────────────────────────────────────────────────┤
│   PYTHON WORKER (CP-SAT Solver)                         │
│   The Chef with the Recipe                              │
│   — Actually solves the scheduling puzzle               │
└─────────────────────────────────────────────────────────┘
         All three talk through MongoDB (storage)
                    and Redis (message queue)
```

### Why split into three?

Solving a timetable can take 10–60 seconds. If the backend had to wait and do it directly, the browser would time out. So the backend *hands off* the job (like a ticket to the kitchen), and the frontend watches a live progress indicator until it's done.

---

## The Core Problem: Why Is It Hard?

Timetabling is a **constraint satisfaction problem**. Imagine trying to seat guests at a wedding where:

- Seat A and B can't be together (faculty conflict)
- Table 3 only fits 40 people (room capacity)
- Uncle Ramesh can't come on Sundays (faculty availability)
- You need to seat 200 guests across 6 tables and 8 time slots

Doing this by hand is error-prone. **CP-SAT** (Google's solver, same tech used in Google Maps routing) tries millions of combinations mathematically and finds one that satisfies every rule. If it finds a perfect solution → **OPTIMAL**. If it satisfies most rules → **FEASIBLE**.

---

## Full Walkthrough — How It Works + How to Demo It

Each section below explains what is happening behind the scenes, followed by the exact steps to show it live during a demo.

---

### Step 1 — Login

**How it works:**
The system has role-based access. An admin account can see and do everything — add faculty, generate timetables, manage users. A faculty member can only view their own schedule. When you log in, the server checks your credentials, generates a secure token (JWT), and stores it in your browser. Every subsequent request carries this token as proof of identity.

**Demo steps:**
1. Open `http://localhost:3000` in a browser.
2. Enter the admin email and password (from your seed data).
3. Click **Login** — you will be redirected to the Dashboard.
4. Notice the top-right corner shows your name and role.

---

### Step 2 — Dashboard Overview

**How it works:**
The dashboard is a live health check of the system. It queries all resource endpoints in parallel and counts how many records exist. If any required resource (departments, rooms, faculty, subjects, calendar) has zero records, the "Generate Timetable" button stays disabled — because the solver cannot run without that data.

**Demo steps:**
1. After login, you land on the **Dashboard** automatically.
2. The **Setup Checklist** on the left shows green ticks for resources already added and numbered steps for those still missing.
3. The **At a Glance** panel on the right shows counts — Departments, Faculty, Subjects, Rooms, Calendars, Timetables.
4. The **Generate Timetable** button is greyed out until all required steps are complete.

---

### Step 3 — Adding a Department

**How it works:**
Everything in the system is grouped under a department. Faculty belong to a department, subjects belong to a department, rooms are owned by a department, and timetables are generated per department. This is why departments must be added first — they are the root of all other data.

**Demo steps:**
1. Click **Departments** in the left sidebar (under Setup).
2. Fill in the form at the top:
   - **Department Code** — e.g., `CSE`
   - **Department Name** — e.g., `Computer Science Engineering`
   - **Room Group** — e.g., `Block A` (which building their classrooms are in)
3. Click **Add Department**.
4. The new department appears in the table below immediately.
5. Go back to the Dashboard — the Departments count is now 1 and the checklist step turns green.

---

### Step 4 — Adding Rooms

**How it works:**
The solver needs to know what physical spaces are available. Each room has a type (classroom, lab, seminar hall) and a capacity. When assigning a lab subject, the solver will only pick a room of type "lab" — it will never put a lab session in a classroom. This matching happens automatically.

**Demo steps:**
1. Click **Rooms** in the sidebar.
2. Fill in:
   - **Room Name** — e.g., `Room 311`
   - **Room Type** — select `Classroom` from the dropdown
   - **Capacity** — e.g., `60`
   - **Department (owner)** — select the department you just created
3. Click **Add Room**.
4. Add at least one more room of type `Lab` to show variety.
5. The table below shows all rooms with their type and capacity.

---

### Step 5 — Adding Faculty

**How it works:**
Faculty are the teaching staff. Each faculty member is linked to a department, has a maximum teaching hours per week limit, and can optionally have an availability matrix (which days/slots they are free). The solver strictly respects max hours — it will never schedule a faculty member beyond their limit, even if that means leaving a subject unscheduled.

**Demo steps:**
1. Click **Faculty** in the sidebar.
2. Fill in:
   - **Full Name** — e.g., `Dr. Priya Nair`
   - **Department** — select from the dropdown (no typing IDs)
   - **Faculty Type** — select `Faculty`
   - **Max Hours / Week** — e.g., `20`
3. Click **Add Faculty Member**.
4. The faculty appears in the table with their department name shown (not a raw database ID).
5. Add 2–3 more faculty members to make the demo realistic.

---

### Step 6 — Adding Subjects

**How it works:**
Subjects define what needs to be taught and how often. The most important field is **Sessions per Week** — this tells the solver how many slots to allocate for this subject each week. A 3-credit theory subject typically needs 3 sessions. A lab subject needs fewer sessions but requires a lab room. The solver uses this number as a hard requirement.

**Demo steps:**
1. Click **Subjects** in the sidebar.
2. Fill in:
   - **Subject Code** — e.g., `CS201`
   - **Subject Name** — e.g., `Data Structures`
   - **Department** — select from the dropdown
   - **Subject Type** — select `Theory`
   - **Credits** — e.g., `3`
   - **Sessions per Week** — e.g., `3`
   - **Room Type Required** — select `Classroom`
3. Click **Add Subject**.
4. Add another subject of type `Lab` with room type `Lab` to show the system handles different room types.
5. The total sessions per week across all subjects is the number of filled slots you will see in the timetable grid.

---

### Step 7 — Setting Up the Academic Calendar

**How it works:**
The calendar defines which semester you are generating a timetable for. Every timetable is tied to a specific year and semester. The start and end dates are used when exporting to iCal (so sessions land on the correct dates in Google Calendar or Outlook).

**Demo steps:**
1. Click **Academic Calendar** in the sidebar (under Scheduling).
2. Fill in:
   - **Academic Year** — e.g., `2026`
   - **Semester** — select `Semester 1 (Odd)`
   - **Start Date** — e.g., `2026-07-01`
   - **End Date** — e.g., `2026-11-30`
3. Click **Add Academic Calendar**.
4. Go back to the Dashboard — all checklist items should now be green and the **Generate Timetable** button becomes active.

---

### Step 8 — Adding a Scheduling Constraint (AI Feature)

**How it works:**
Before generating, you can define rules the solver must follow. The system uses Google Gemini AI to understand plain English. You type a sentence like *"Dr. Priya is not available on Wednesdays"* and the AI converts it into a structured rule that the CP-SAT solver can enforce as a hard constraint. This is the key AI-powered feature of the system.

**Demo steps:**
1. Click **Timetables** in the sidebar.
2. Select a **Department** and **Semester** from the dropdowns.
3. A text box appears: **"Add a Scheduling Rule"**.
4. Type: `Dr. Priya Nair is not available on Wednesdays`
5. Click **Add Rule** — the AI parses it and saves the constraint.
6. You can verify it was saved by going to **Constraints** in the sidebar, where it appears with its parsed type and status.

---

### Step 9 — Generating the Timetable

**How it works:**
When you click Generate, the frontend sends the selected department and semester to the backend. The backend creates a solver job, pushes it into Redis (a fast message queue — like a ticket system), and returns immediately with a job ID. The Python CP-SAT worker picks up the job, loads all faculty, subjects, rooms, and constraints from the database, and mathematically finds a valid assignment for every session — no two faculty in the same slot, no room double-booked, all constraints satisfied. The result is saved back to the database and the frontend is notified via a live push (SSE).

**Demo steps:**
1. On the **Timetables** page, select your department and semester.
2. Click **Generate Timetable**.
3. Watch the live progress indicator:
   - ⏳ *Waiting for solver to start…*
   - ⚙️ *Solver is running — building your timetable…*
   - ✅ *Timetable generated for [Department] — Semester 1, 2026*
4. This is the CP-SAT solver running in real time. No page refresh is needed.

---

### Step 10 — Viewing the Timetable Grid

**How it works:**
The timetable is stored as a list of sessions, each with a day (1=Mon to 6=Sat), a slot (0=08:30 to 7=15:30), a subject, a faculty member, and a room. The frontend builds a 6×8 grid and places each session in the correct cell. Cells with no session are empty — this is normal; a department does not have class every hour of every day.

**Demo steps:**
1. After generation completes, the **Timetable Grid** appears below.
2. The grid shows **Monday to Saturday** as columns and **08:30–15:30** as rows (in 1-hour slots).
3. Each filled cell shows:
   - Subject code (e.g., `CS201`)
   - Faculty name (e.g., `Dr. Priya Nair`)
   - Room (e.g., `Room 311`)
4. Switch to **Faculty View** using the toggle button.
5. Select a faculty member from the dropdown — you see only their assigned sessions listed chronologically.

---

### Step 11 — Exporting the Timetable

**How it works:**
Once a timetable is generated, it can be exported in two formats. **PDF** generates a printable formatted grid. **iCal** generates a `.ics` file that can be imported into any calendar app (Google Calendar, Outlook, Apple Calendar), placing each class as a recurring weekly event on the correct date.

**Demo steps:**
1. After generation, click **Export PDF** — the browser downloads or opens a formatted timetable PDF.
2. Click **Export to Calendar** — downloads a `.ics` file.
3. Open the `.ics` file in any calendar app to show sessions appearing on real dates for the semester duration.

---

### Step 12 — Recording a Daily Override

**How it works:**
After a timetable is published, day-to-day disruptions (a faculty calling in sick, a room being blocked for an event, a makeup class) are handled through **Overrides**. These do NOT re-run the solver — that would be too slow for a same-day change. Instead, a lightweight greedy algorithm finds the best substitute faculty for that specific slot. The original timetable remains untouched; overrides are just layered on top.

**Demo steps:**
1. Click **Overrides** in the sidebar (under Daily Operations).
2. Fill in:
   - **Date** — today's date
   - **Override Type** — select `Teacher Absent`
   - **Reason** — e.g., `Medical leave`
3. Click **Add Daily Override**.
4. The override is recorded and would trigger a notification to relevant staff.

---

### Step 13 — Audit Log

**How it works:**
Every action performed in the system (creating a department, generating a timetable, recording an override) is automatically logged with the user's email, the action type, the endpoint hit, and the timestamp. This provides full accountability — you can always see who did what and when.

**Demo steps:**
1. Click **Audit Log** in the sidebar (under Admin).
2. The table shows all recent actions: User, Action (POST/DELETE), Endpoint, Status, and Date.
3. You will see your own actions from this demo session listed here.

---

## In One Sentence

> An admin fills in their college's departments, rooms, faculty, and subjects once — then clicks a button — and the system automatically generates a conflict-free timetable for the entire semester, respecting every scheduling rule, in under a minute.
