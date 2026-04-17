# Timetable Optimizer — API Documentation

> Base URL: `http://localhost:8080/api/v1`
> All protected routes require: `Authorization: Bearer <jwt_token>`
> All responses follow the envelope: `{ success, data, meta, error }`

---

## Users `admin only`

### GET `/users` 🔒 `admin`
List all users.

**Query params:** `role=admin|hod|faculty|staff`, `dept_id`, `status=active|inactive`, `page`, `limit`

---

### GET `/users/:id` 🔒 `admin`

---

### POST `/users` 🔒 `admin`
Create a new user account.
```json
{
  "name": "Dr. Suchitra Pattnaik",
  "email": "suchitra@gift.edu.in",
  "password": "faculty123",
  "role": "faculty",
  "dept_id": "DEPT_OBJECT_ID",
  "status": "active"
}
```
> `role`: `admin` | `hod` | `faculty` | `staff`

---

### PATCH `/users/:id` 🔒 `admin`
Update role, dept, or status. Password cannot be changed here.
```json
{ "role": "hod", "dept_id": "DEPT_OBJECT_ID", "status": "active" }
```

---

### DELETE `/users/:id` 🔒 `admin`

---

## Audit Log `admin only`

### GET `/audit` 🔒 `admin`
Query all mutation logs (POST/PATCH/DELETE across all routes).

**Query params:** `userId`, `method=POST|PATCH|DELETE`, `page`, `limit`

**Response `data`**
```json
[{
  "_id": "...",
  "user_id": { "name": "Admin", "email": "admin@gift.edu.in" },
  "method": "POST",
  "path": "/api/v1/timetables/generate",
  "body": { "semester_id": "...", "dept_id": "..." },
  "status_code": 202,
  "ip": "::1",
  "created_at": "2026-04-15T10:00:00Z"
}]
```

---

## Year Rollover

### POST `/calendars/rollover` 🔒 `admin`
Start a new semester from an existing one. Copies constraints optionally.

```json
{
  "from_semester_id": "SEMESTER_OBJECT_ID",
  "to_year": 2027,
  "to_semester": 1,
  "start_date": "2027-07-01",
  "end_date": "2027-11-30",
  "copy_constraints": true
}
```

**Response `data`**
```json
{
  "new_calendar": { "_id": "...", "year": 2027, "semester": 1 },
  "summary": {
    "active_faculty": 36,
    "active_subjects": 34,
    "constraints_copied": 5,
    "note": "Copied constraints are in 'pending' status — review before activating"
  }
}
```
> Faculty and subjects are not duplicated — they carry over automatically since they are not semester-specific.
> Copied constraints are set to `pending` so admin can review before the solver uses them.

---

## Authentication

### POST `/auth/login`
Get a JWT token.

**Body**
```json
{ "email": "admin@gift.edu.in", "password": "admin123" }
```
**Response**
```json
{
  "data": {
    "token": "eyJ...",
    "user": { "id": "...", "name": "Admin", "email": "...", "role": "admin" }
  }
}
```

---

### GET `/auth/me` 🔒
Get the currently logged-in user.

---

### POST `/auth/logout` 🔒
Invalidate session (client should discard token).

---

## Departments

### GET `/departments` 🔒
List all departments.

**Query params:** `active=true|false`

**Response `data`**
```json
[{ "_id": "...", "code": "CSE", "name": "Computer Science and Engineering", "active": true }]
```

---

### GET `/departments/:id` 🔒
Get single department.

---

### POST `/departments` 🔒 `admin`
Create a department.
```json
{ "code": "CSE", "name": "Computer Science and Engineering", "room_group": "Block A" }
```

---

### PATCH `/departments/:id` 🔒 `admin`
Update department.
```json
{ "name": "Updated Name", "active": false }
```

---

### DELETE `/departments/:id` 🔒 `admin`

---

## Faculty

### GET `/faculty` 🔒
List faculty with pagination.

**Query params:** `dept_id`, `page=1`, `limit=20`

**Response `data`** — array, each with populated `dept_id`

---

### GET `/faculty/:id` 🔒

---

### POST `/faculty` 🔒 `admin | hod`
```json
{
  "user_id": "USER_OBJECT_ID",
  "name": "Dr. Suchitra Pattnaik",
  "dept_id": "DEPT_OBJECT_ID",
  "type": "faculty",
  "expertise": ["Artificial Intelligence", "Machine Learning"],
  "max_hours_per_week": 18,
  "availability": [
    [true, true, true, true, true, true, true, true],
    [true, true, true, true, true, true, true, true],
    [true, true, true, true, true, true, true, true],
    [true, true, true, true, true, true, true, true],
    [true, true, true, true, true, true, true, true],
    [true, true, false, false, false, false, false, false]
  ],
  "preferences": {
    "preferred_slots": [{ "day": 1, "slot": 2 }],
    "avoid_slots": [{ "day": 5, "slot": 7 }]
  },
  "joined_date": "2020-07-01",
  "status": "active",
  "is_probation": false
}
```
> `availability`: 6 rows (Mon–Sat) × 8 columns (slots 0–7). `true` = available.

---

### PATCH `/faculty/:id` 🔒 `admin | hod`
Partial update — send only the fields to change.

---

### DELETE `/faculty/:id` 🔒 `admin`

---

## Subjects

### GET `/subjects` 🔒
**Query params:** `dept_id`, `type=theory|lab|tutorial`, `page`, `limit`

---

### GET `/subjects/:id` 🔒

---

### POST `/subjects` 🔒 `admin | hod`
```json
{
  "code": "CS201",
  "name": "Programming Using Data Structures",
  "dept_id": "DEPT_OBJECT_ID",
  "type": "theory",
  "credits": 4,
  "sessions_per_week": 4,
  "session_duration_slots": 1,
  "batch_count": 1,
  "requires_lab_assistant": false,
  "room_type_required": "classroom",
  "enrollment": 60
}
```
> `type`: `theory` | `lab` | `tutorial`
> `room_type_required`: `classroom` | `lab` | `seminar_hall` | `auditorium`

---

### PATCH `/subjects/:id` 🔒 `admin | hod`

---

### DELETE `/subjects/:id` 🔒 `admin`

---

## Rooms

### GET `/rooms` 🔒
**Query params:** `dept_id`, `type=classroom|lab|seminar_hall|auditorium`, `page`, `limit`

---

### GET `/rooms/:id` 🔒

---

### POST `/rooms` 🔒 `admin`
```json
{
  "name": "Room 311",
  "type": "classroom",
  "capacity": 60,
  "dept_id": "DEPT_OBJECT_ID",
  "amenities": ["projector", "whiteboard"],
  "blocked_slots": [{ "day": 5, "slot": 7 }],
  "active": true
}
```

---

### PATCH `/rooms/:id` 🔒 `admin`

---

### DELETE `/rooms/:id` 🔒 `admin`

---

## Academic Calendars

### GET `/calendars` 🔒
List all semesters, sorted latest first.

---

### GET `/calendars/:semesterId` 🔒

---

### POST `/calendars` 🔒 `admin`
```json
{
  "year": 2026,
  "semester": 1,
  "start_date": "2026-07-01",
  "end_date": "2026-11-30",
  "holidays": ["2026-08-15", "2026-10-02", "2026-11-01"],
  "half_days": ["2026-09-05"],
  "events": [
    {
      "date": "2026-09-20",
      "name": "Annual Sports Day",
      "slots_blocked": [{ "day": 6, "slot": 1 }]
    }
  ]
}
```

---

### PATCH `/calendars/:semesterId` 🔒 `admin`

---

### DELETE `/calendars/:semesterId` 🔒 `admin`

---

## Constraints

### GET `/constraints` 🔒
**Query params:** `semesterId`, `deptId`, `type=hard|soft`, `page`, `limit`

---

### GET `/constraints/:id` 🔒

---

### POST `/constraints` 🔒 `admin | hod`
Manually create a structured constraint.
```json
{
  "semester_id": "SEMESTER_OBJECT_ID",
  "dept_id": "DEPT_OBJECT_ID",
  "raw_text": "Dr. Suchitra is not available on Saturdays",
  "parsed_json": {
    "rule": { "unavailable_days": [5] },
    "entities": { "faculty_name": "Dr. Suchitra Pattnaik" }
  },
  "type": "hard",
  "weight": 5
}
```

---

### POST `/constraints/parse` 🔒 `admin | hod` ⭐ LLM
Convert plain English → structured constraint using Gemini AI.
```json
{
  "raw_text": "Dr. Suchitra Pattnaik is not available on Saturdays",
  "semester_id": "SEMESTER_OBJECT_ID",
  "dept_id": "DEPT_OBJECT_ID",
  "auto_save": true
}
```
> `auto_save: true` → parses AND saves to DB in one call
> `auto_save: false` → returns parsed JSON only, nothing saved

**Response `data`**
```json
{
  "raw_text": "...",
  "parsed_json": {
    "type": "hard",
    "category": "faculty_availability",
    "weight": 5,
    "entities": { "faculty_name": "Dr. Suchitra Pattnaik" },
    "rule": { "unavailable_days": [5] },
    "summary": "Dr. Suchitra Pattnaik unavailable on Saturdays"
  },
  "saved": { "_id": "...", ... }
}
```

---

### PATCH `/constraints/:id` 🔒 `admin | hod`

---

### DELETE `/constraints/:id` 🔒 `admin | hod`

---

## Timetables

### GET `/timetables` 🔒
**Query params:** `semesterId`, `deptId`, `status=draft|published|archived`, `page`, `limit`

---

### GET `/timetables/:scheduleId` 🔒
Get full schedule with populated sessions.

**Response `data.sessions[]`**
```json
{
  "faculty_id": { "_id": "...", "name": "Dr. Suchitra Pattnaik" },
  "subject_id": { "_id": "...", "name": "Programming Using DS", "code": "CS201" },
  "room_id":    { "_id": "...", "name": "Room 311" },
  "day": 1,
  "slot": 2,
  "is_locked": false,
  "batch": 1
}
```
> `day`: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
> `slot`: 0–7 → 08:30, 09:30, 10:30, 11:30, 12:30, 13:30, 14:30, 15:30

---

### POST `/timetables/generate` 🔒 `admin | hod` ⭐ ASYNC
Trigger timetable generation. Returns immediately with a job ID.
```json
{ "semester_id": "SEMESTER_OBJECT_ID", "dept_id": "DEPT_OBJECT_ID" }
```
**Response `data`**
```json
{ "scheduleId": "...", "jobId": "...", "status": "pending" }
```
> The Python CP-SAT worker picks this up from Redis and solves in the background.
> Poll `/status` or subscribe to `/stream` to track progress.

---

### GET `/timetables/:scheduleId/status` 🔒
Poll job status.

**Response `data`**
```json
[{ "jobId": "...", "dept_id": "...", "status": "running|done|failed", "duration_ms": 4200 }]
```

---

### GET `/timetables/:scheduleId/stream` 🔒 ⭐ SSE
Real-time generation progress via Server-Sent Events.

**How to connect (browser):**
```js
const source = new EventSource(
  `http://localhost:8080/api/v1/timetables/${scheduleId}/stream`,
  { headers: { Authorization: `Bearer ${token}` } }
);
source.addEventListener('connected',  (e) => console.log(e.data));
source.addEventListener('running',    (e) => console.log(e.data));
source.addEventListener('completed',  (e) => console.log(e.data));
source.addEventListener('failed',     (e) => console.log(e.data));
```

**Events emitted:** `connected` → `running` → `completed` | `failed`

---

### GET `/timetables/:scheduleId/explain` 🔒 ⭐ LLM
If a schedule failed, get a plain English explanation of why.

**Response `data`**
```json
{ "explanation": "The current constraints make it impossible to assign Dr. Smith because she is unavailable on all days when CS201 needs to be scheduled. Consider relaxing her Friday constraint or adding another faculty member with the same expertise." }
```

---

### POST `/timetables/:scheduleId/lock` 🔒 `admin | hod`
Lock all sessions. Schedule must be in `draft` status.

---

### POST `/timetables/:scheduleId/publish` 🔒 `admin`
Publish schedule. Status changes `draft → published`. Timetable becomes immutable.

---

## Daily Overrides

### GET `/overrides` 🔒
**Query params:** `date=YYYY-MM-DD`, `type=teacher_absent|room_blocked|extra_class|holiday|half_day`, `page`, `limit`

---

### GET `/overrides/suggestions` 🔒 ⭐ Greedy
Get available substitute teachers for a given slot.

**Query params:** `dept_id`, `date`, `period` (0–7), `subject_id` (optional)

**Response `data`**
```json
[
  { "faculty_id": "...", "name": "Rojalini Behera", "expertise": ["Mathematics"], "type": "faculty" }
]
```

---

### GET `/overrides/:id` 🔒

---

### POST `/overrides/absence` 🔒 `admin | hod | faculty`
Report a teacher absence. If no substitute given, system auto-suggests one.
```json
{
  "date": "2026-09-15",
  "original_teacher_id": "FACULTY_OBJECT_ID",
  "substitute_teacher_id": "FACULTY_OBJECT_ID",
  "slot": { "day": 1, "period": 2 },
  "subject_id": "SUBJECT_OBJECT_ID",
  "room_id": "ROOM_OBJECT_ID",
  "dept_id": "DEPT_OBJECT_ID",
  "reason": "Medical leave"
}
```
> `substitute_teacher_id` is optional — omit it to receive greedy suggestions in the response.

**Response `data`**
```json
{
  "override": { "_id": "...", "type": "teacher_absent", ... },
  "suggestions": [
    { "faculty_id": "...", "name": "Tapas Kumar Parida", "expertise": ["Programming"] }
  ]
}
```

---

### POST `/overrides/room-block` 🔒 `admin | hod`
```json
{
  "date": "2026-09-20",
  "room_id": "ROOM_OBJECT_ID",
  "slot": { "day": 6, "period": 1 },
  "reason": "Seminar event"
}
```

---

### POST `/overrides/extra-class` 🔒 `admin | hod`
```json
{
  "date": "2026-09-22",
  "original_teacher_id": "FACULTY_OBJECT_ID",
  "slot": { "day": 1, "period": 7 },
  "subject_id": "SUBJECT_OBJECT_ID",
  "room_id": "ROOM_OBJECT_ID",
  "reason": "Makeup class for Independence Day holiday"
}
```

---

### DELETE `/overrides/:id` 🔒 `admin | hod`

---

## Exports

### GET `/exports/:scheduleId/pdf` 🔒
Download timetable as PDF.

> Response: binary PDF file with `Content-Disposition: attachment`

---

### GET `/exports/:scheduleId/ical` 🔒
Download timetable as `.ics` calendar file (importable into Google Calendar, Outlook, etc.)

**Query params:** `startDate=YYYY-MM-DD` (semester start date, defaults to today)

> Response: `.ics` file with weekly recurring events for every session.

---

## Notifications

### GET `/notifications` 🔒
Get notifications for the logged-in user.

**Query params:** `read=true|false`

**Response `data`**
```json
[{
  "_id": "...",
  "type": "timetable_published",
  "title": "Timetable Published",
  "message": "CSE Sem 1 timetable has been published.",
  "read": false,
  "created_at": "2026-04-15T10:00:00Z"
}]
```

---

### GET `/notifications/unread-count` 🔒
```json
{ "data": { "count": 3 } }
```

---

### PATCH `/notifications/mark-all-read` 🔒
Mark all notifications as read.

---

### PATCH `/notifications/:id/read` 🔒
Mark single notification as read.

---

## Standard Response Envelope

### Success
```json
{
  "success": true,
  "data": { ... },
  "meta": { "timestamp": "2026-04-15T10:00:00Z", "total": 20, "page": 1, "limit": 20 },
  "error": null
}
```

### Error
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "NOT_FOUND | DUPLICATE | FORBIDDEN | UNAUTHORIZED | VALIDATION_ERROR | AUTH_FAILED | INVALID_STATE",
    "message": "Human readable message",
    "details": []
  }
}
```

---

## RBAC Summary

| Role | Can do |
|---|---|
| `admin` | Everything |
| `hod` | Faculty/subject/constraint/timetable management within dept |
| `faculty` | Report own absence |
| `staff` | Read only |

---

## Slot Reference

| Slot | Time |
|---|---|
| 0 | 08:30 – 09:30 |
| 1 | 09:30 – 10:30 |
| 2 | 10:30 – 11:30 |
| 3 | 11:30 – 12:30 |
| 4 | 12:30 – 13:30 |
| 5 | 13:30 – 14:30 |
| 6 | 14:30 – 15:30 |
| 7 | 15:30 – 16:30 |
