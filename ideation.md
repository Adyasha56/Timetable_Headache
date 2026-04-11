# Timetable Optimizer — Project Context for Claude Code

## What we're building

A university-wide, AI-powered department timetable optimizer. Takes faculty
availability, subjects, rooms, and constraints as input → generates a
conflict-free timetable automatically. Target scale: 500+ faculty, university-wide.

---

## Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js | Input wizard, timetable grid, conflict panel |
| Backend | Go (Gin or Chi) | Preferred over Node — goroutines for parallel job dispatch |
| Database | MongoDB Atlas | Native Go driver. NOT Prisma (Node-only) |
| Queue | Redis | Job queue between Go orchestrator and Python workers |
| Solver | Python + OR-Tools CP-SAT | Separate sidecar worker pool |
| AI | Anthropic API (claude-sonnet-4-6) | Called from Go LLM service |
| Deployment | Docker | One container per service |

---

## Service architecture

### 5 services

```
Next.js frontend
      |
      | REST + SSE
      |
Go API Gateway (Gin/Chi)          ← auth, routing, SSE streaming
      |
      |─── Go Data Service         ← CRUD: faculty, rooms, subjects, schedules
      |
      |─── Go Solver Orchestrator  ← job dispatch, status, merge, reconcile
      |         |
      |         | Redis LPUSH/BRPOP
      |         |
      |    Python CP-SAT Workers   ← one worker per dept, run in parallel
      |
      └─── Go LLM Service          ← calls Anthropic API, 2 touchpoints only
```

### Go API Gateway
- Auth, routing, SSE streaming to Next.js
- Exposes REST endpoints + Server-Sent Events for live generation progress

### Go Data Service
- CRUD for faculty, rooms, subjects, constraints, schedules
- Reads/writes MongoDB Atlas
- Feeds solver payload to orchestrator on demand

### Go Solver Orchestrator
- Receives generate request
- Fetches all data from MongoDB
- Calls LLM service first (constraint parsing)
- Enqueues one Redis job per department
- Waits for all workers, then runs cross-dept reconciler
- Saves final merged schedule to MongoDB
- Streams progress to frontend via SSE

### Go LLM Service
- HTTP calls to `https://api.anthropic.com/v1/messages`
- Headers: `x-api-key` (from env), `anthropic-version: 2023-06-01`
- Exactly 2 touchpoints (see LLM section below)
- Returns structured JSON back to orchestrator

### Python CP-SAT Worker Pool
- Each worker: `BRPOP solver:jobs` → solve → `HSET solver:results:<job_id>`
- Runs in parallel, one worker per department
- Uses Google OR-Tools CP-SAT

---

## Critical architectural split — two scheduling problems

### Problem 1: Base timetable (CP-SAT, once per semester)
- Triggered by HOD clicking "Generate"
- Takes 30–120 seconds — acceptable
- Full CP-SAT model with hard + soft constraints
- Produces master schedule stored in MongoDB
- **Heavy path**

### Problem 2: Daily operations (greedy, real-time)
- Teacher absent, holiday, room blocked, event added
- Must respond in **< 5 seconds**
- Never touches CP-SAT — lightweight greedy constraint check in Go
- Writes override records on top of base timetable (base is immutable)
- **Effective timetable = base + overrides**

> Rule: never route daily operations through the solver. Two separate codepaths.

---

## LLM integration — exactly 2 touchpoints

### Touchpoint 1: Pre-solve constraint parsing

```
Input:  HOD types "Prof. Sharma not before 10am on Mon/Wed"
Action: Go LLM service → claude-sonnet-4-6 with JSON-mode system prompt
Output: structured constraint JSON fed into CP-SAT model builder

// If constraints are mutually impossible, LLM flags it before solver runs
```

### Touchpoint 2: Post-solve conflict explanation

```
Input:  CP-SAT returns INFEASIBLE + violated constraint IDs
Action: Go LLM service → claude-sonnet-4-6 → plain-English explanation + fix suggestion
Output: streams via SSE → shown in conflict panel in Next.js
        HOD clicks "apply fix" → relaxes constraint → solver re-runs
```

### How Go calls Anthropic API

```go
// POST https://api.anthropic.com/v1/messages
// Headers: x-api-key from env, anthropic-version: 2023-06-01
// Body: model, max_tokens, system (JSON schema instruction), user (raw text)
// Parse: response.content[0].text → json.Unmarshal into constraint struct
```

---

## CP-SAT model (per-dept worker)

### Decision variable

```
x[f, s, r, d, t] = bool
  f = faculty
  s = subject
  r = room
  d = day (0–4)
  t = timeslot (0–7)
```

### Pre-pruning (reduces variable count 70–80%)

- Only create `x[f,s,...]` where faculty `f` is assigned to subject `s`
- Only create `x[...,r,...]` where room type matches subject type
- Only create `x[...,d,t]` within faculty availability windows

### Hard constraints

```python
# No faculty double-booked
model.add_at_most_one(x[f,s,r,d,t] for s,r if (f,s,r,d,t) in x)

# No room double-booked
model.add_at_most_one(x[f,s,r,d,t] for f,s if (f,s,r,d,t) in x)

# Each subject gets exactly N sessions/week
model.add(sum(x[f,s,r,d,t] ...) == sessions_per_week[s])

# Lab subjects → lab rooms only (enforced in variable pruning)

# Room capacity >= enrollment (enforced in variable pruning)

# Minimum break: if teaching slot t, cannot teach t+1
model.add(x[f,s1,r1,d,t] + x[f,s2,r2,d,t+1] <= 1)
```

### Soft constraints (penalties, minimized)

- Faculty preferred time slots
- Spread sessions evenly across week
- Minimize room travel between back-to-back classes
- Max hours per day per faculty
- No isolated single slots mid-day

### Objective

```python
model.minimize(sum(all soft penalty variables))
```

### Solver parameters

```python
solver.parameters.num_workers = 8          # match CPU cores
solver.parameters.max_time_in_seconds = 120 # return best-so-far on timeout
solver.parameters.log_search_progress = True
# Warm-start hint from previous semester's schedule
```

### UNSAT path

```
1. Re-run CP-SAT in assumptions mode → find minimum violated constraint set
2. Pass violated constraint IDs + descriptions to LLM touchpoint 2
3. Stream plain-English explanation to UI via SSE
4. HOD relaxes constraint → re-run solver
```

---

## Hierarchical solver (university scale)

```
Orchestrator
├── Dept A CP-SAT worker  ─┐
├── Dept B CP-SAT worker   ├── all run in parallel via Redis
├── Dept C CP-SAT worker   │
└── Dept N CP-SAT worker  ─┘
         │
         ▼
Cross-dept reconciler (second smaller CP-SAT)
  - Shared room conflicts (two depts booked same room+slot)
  - Joint/elective courses (students from multiple depts)
  - Faculty teaching in two depts
  - Goal: minimum slot swaps to eliminate conflicts
         │
         ▼
Merged university timetable → saved to MongoDB
```

### Redis job queue pattern

```
Go pushes  →  LPUSH solver:jobs  <job_payload_json>
Python pops → BRPOP solver:jobs  (blocking, waits for work)
Python done → HSET solver:results:<job_id>  result <partial_schedule_json>
Go polls   →  HGET solver:results:<job_id>
```

---

## Real-world domain model

### People types

| Type | Scheduling rules |
|---|---|
| Faculty | Theory + lab, max_hours_per_week, availability grid, preferences |
| Lab assistant | Lab slots only, cannot be assigned theory classes |
| HOD | Role assignment (time-bounded), not a person property. Can take classes. |
| New joinee | Same as faculty but `is_probation: true`, capped at 12hrs, LLM suggests allocation |

> HOD is always a **role**, never a property of a person record.
> At year start: admin revokes old HOD role, assigns new HOD role. Person records unchanged.

### Room types

| Type | Notes |
|---|---|
| Classroom | capacity, projector, AC flags |
| Lab | equipment type, batch_size (class split into batches of ~20) |
| Shared space | Seminar halls, auditoriums — handled by cross-dept reconciler |

### Lab class special handling

```
CS403 DBMS Lab — 60 students
  → 3 batches of 20
  → Each batch: 1 faculty + 1 lab assistant + lab room
  → 3 separate 3-hour blocks per week
  → Cannot overlap (one lab room)

CP-SAT variable: x[f, s, r, batch, d, t_start]
  where t_start blocks slots t_start, t_start+1, t_start+2 (3hrs)
```

### Dynamic daily events

| Event type | System action | Latency |
|---|---|---|
| `holiday` | Block entire day in calendar | — |
| `half_day` | Truncate to morning slots | — |
| `college_event` | Block specific slots | — |
| `teacher_absent` | Greedy substitute search | < 5s |
| `room_blocked` | Greedy room swap | < 5s |
| `extra_class` | HOD manually adds session | — |

### Override architecture

```
base_timetable  (immutable for semester)
      +
daily_overrides (append-only event log)
      =
effective_timetable_for_today  ← what UI renders
```

### Substitute teacher algorithm (greedy, not CP-SAT)

```
Given: teacher X absent, slot [Mon 10am], subject CS301

1. Find all faculty with CS301 in expertise[]
2. Filter: free at Mon 10am in base timetable
3. Filter: not already substituted twice today
4. Filter: didn't substitute CS301 last time it was covered
5. Pick lowest-load teacher from remaining list
6. Write override record to MongoDB
7. Push notification to substitute teacher
```

### Academic year rollover

```
End of year:
1. Admin creates new semester_config
2. Clone subject list (editable)
3. Clone room inventory (editable)
4. Reset all role_assignments → admin re-assigns HOD
5. Carry forward faculty records (update availability only)
6. Archive last year's timetable (read-only)
7. Run fresh CP-SAT for new semester
```

### New joinee onboarding

```
1. Admin creates faculty record with expertise[], is_probation: true
2. LLM suggests subject allocation:
   Prompt: "Given unallocated subjects [list] and new faculty expertise [list],
            suggest allocation. Max 2 subjects, max 12hrs, no advanced subjects."
3. HOD reviews + approves in UI
4. Solver treats joinee like any faculty member (just different max_hours)
```

---

## MongoDB collections

```js
// Role assignments — time-bounded
role_assignments: {
  _id, person_id, role,           // "HOD" | "exam_coordinator" etc.
  dept_id, academic_year,
  active: bool,
  can_take_classes: bool
}

// Faculty — persists across academic years
faculty: {
  _id, name,
  type,                           // "faculty" | "lab_assistant" | "visiting"
  expertise: [subject_codes],
  max_hours_per_week: Number,
  availability: [[bool]],         // [5 days][8 slots]
  preferences: {
    preferred_slots: [[d,t]],
    avoid_slots: [[d,t]]
  },
  joined_date, status,
  is_probation: bool
}

// Subjects
subjects: {
  _id, code, name, dept_id,
  type,                           // "theory" | "lab" | "tutorial"
  credits,
  sessions_per_week: Number,
  session_duration_slots: Number, // 1 for theory, 3 for lab
  batch_count: Number,            // 1 for theory, 2-3 for lab
  requires_lab_assistant: bool,
  room_type_required              // "classroom" | "lab"
}

// Rooms
rooms: {
  _id, name,
  type,                           // "classroom" | "lab" | "seminar_hall" | "auditorium"
  capacity: Number,
  dept_id,                        // null = shared/central
  amenities: [String],
  blocked_slots: [[d,t]]
}

// Academic calendar
academic_calendars: {
  _id, year, semester,
  start_date, end_date,
  holidays: [Date],
  half_days: [Date],
  events: [{ date, slots_blocked: [[d,t]], name }]
}

// Constraints (raw text + parsed JSON)
constraints: {
  _id, semester_id, dept_id,
  raw_text: String,               // what HOD typed
  parsed_json: Object,            // what LLM returned
  type,                           // "hard" | "soft"
  weight: Number,                 // for soft constraints
  created_by
}

// Solver jobs — one per dept per generation run
solver_jobs: {
  _id, schedule_id, dept_id,
  status,                         // "pending"|"running"|"done"|"failed"
  result: Object,                 // partial schedule JSON
  error: String,                  // infeasibility reason
  duration_ms: Number
}

// Base timetable (immutable once published)
schedules: {
  _id, semester_id, dept_id,
  status,                         // "draft"|"published"|"archived"
  sessions: [{
    faculty_id, subject_id, room_id,
    day: Number,                  // 0-4
    slot: Number,                 // 0-7
    is_locked: bool,              // won't move on re-solve
    batch: Number                 // null for theory, 1/2/3 for lab
  }],
  version: Number,
  created_at: Date
}

// Daily overrides (append-only event log)
daily_overrides: {
  _id, date: Date,
  type,                           // see event types above
  original_teacher_id,
  substitute_teacher_id,
  slot: { day, period },
  subject_id, room_id,
  reason: String,
  created_by,                     // "system" | "HOD" | "admin"
  notified_at: Date
}
```

---

## Next.js frontend — 3 user flows

### Flow 1: Input wizard
- Faculty availability grid (5 days × 8 slots, per teacher)
- Subject-to-teacher assignment matrix
- Room inventory (type, capacity, amenities)
- Free-text constraint input (parsed by LLM)

### Flow 2: Generation view
- SSE-driven live progress bar
- Messages: "Dept CS solved...", "Dept EE solved...", "Reconciling..."
- Timetable grid fills in progressively as results stream in
- Conflict panel appears if UNSAT, with LLM explanation + one-click fix

### Flow 3: Manual adjustment
- Drag-drop slot swaps
- Live re-validation on each swap (lightweight Go endpoint, not full solver)
- Lock specific slots before re-solve (`is_locked: true`)
- Export to PDF / iCal

---

## Build order

### Phase 1 — Working skeleton (no LLM yet)
- [ ] MongoDB schema setup (all collections above)
- [ ] Go data service — faculty, rooms, subjects CRUD endpoints
- [ ] Redis queue setup
- [ ] Python CP-SAT worker skeleton (single dept, hardcoded constraints)
- [ ] Go orchestrator — enqueue jobs, collect results, save to MongoDB
- [ ] Static timetable grid in Next.js (no generation yet)

### Phase 2 — LLM integration
- [ ] Go LLM service with constraint parsing prompt (touchpoint 1)
- [ ] UNSAT → LLM explanation pipeline (touchpoint 2)
- [ ] SSE streaming from Go to Next.js
- [ ] Conflict panel UI in Next.js

### Phase 3 — Real-world events
- [ ] Academic calendar + holiday blocking
- [ ] Daily override system (append-only log)
- [ ] Greedy substitute allocation algorithm
- [ ] Room swap on room-blocked event
- [ ] Academic year rollover wizard
- [ ] New joinee onboarding + LLM allocation suggestion

### Phase 4 — Polish
- [ ] Cross-dept reconciler (shared rooms, joint courses)
- [ ] Warm-start solver from previous semester
- [ ] Drag-drop manual adjustment + slot locking
- [ ] PDF / iCal export
- [ ] Fairness scoring dashboard (workload balance across faculty)

---

## Rules — always follow these

1. **Never mutate the base timetable.** Always write override records.
2. **Daily operations never use CP-SAT.** Greedy only. Must be < 5 seconds.
3. **HOD is always a role, never a person property.** Use `role_assignments` collection.
4. **LLM has exactly 2 jobs:** parse constraints (pre-solve) and explain conflicts (post-solve).
5. **Lab classes use a different CP-SAT variable type** — includes batch dimension and blocks multiple consecutive slots.
6. **Pre-prune CP-SAT variables aggressively** before handing to solver (70–80% reduction target).
7. **One Redis job per department.** All run in parallel.
8. **SSE not polling** — generation progress streams live to UI.
9. **Minimum break enforced as hard constraint** — faculty cannot teach back-to-back slots.
10. **Shared rooms go to the cross-dept reconciler**, not individual dept solvers.
