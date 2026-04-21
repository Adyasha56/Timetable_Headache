"use client";

import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { API_BASE_URL, DAYS, SLOTS } from "@/lib/constants";
import { streamSse } from "@/lib/stream";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/ui/select-native";

type SessionItem = {
  day: number;
  slot: number;
  duration_slots?: number;
  subject_id?: { name?: string; code?: string } | string;
  faculty_id?: { name?: string } | string;
  room_id?: { name?: string } | string;
};

type ScheduleRow = {
  _id: string;
  status: string;
  created_at?: string;
  dept_id?: { name?: string; code?: string } | string;
  semester_id?: { year?: number; semester?: number } | string;
  sessions?: SessionItem[];
};

type SolverJob = { status: string; error?: string; duration_ms?: number };


type Department = { _id: string; name: string; code: string };
type Calendar = { _id: string; year: number; semester: number };
type Section = { _id: string; name: string; dept_id: string };

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    done: "default",
    running: "secondary",
    pending: "outline",
    failed: "destructive",
  };
  const labels: Record<string, string> = {
    done: "Completed",
    running: "Running",
    pending: "Pending",
    failed: "Failed",
  };
  return (
    <Badge variant={variants[status] ?? "outline"}>
      {labels[status] ?? status}
    </Badge>
  );
}

function getSessionLabel(val: { name?: string; code?: string } | string | undefined): string {
  if (!val) return "—";
  if (typeof val === "string") return val;
  return val.code ?? val.name ?? "—";
}

function getFacultyLabel(val: { name?: string } | string | undefined): string {
  if (!val) return "";
  if (typeof val === "string") return "";
  return val.name ?? "";
}

export function TimetablePanel() {
  const queryClient = useQueryClient();
  const [deptId, setDeptId] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [scheduleId, setScheduleId] = useState("");
  const [solverProgress, setSolverProgress] = useState<"idle" | "pending" | "running" | "done" | "failed">("idle");
  const [solverError, setSolverError] = useState("");
  // Constraint text for plain-English rule input
  const [constraintText, setConstraintText] = useState("");
  const [constraintLoading, setConstraintLoading] = useState(false);
  // Faculty view filter
  const [viewMode, setViewMode] = useState<"grid" | "faculty">("grid");
  const [selectedFaculty, setSelectedFaculty] = useState("");
  // Ref to scroll to timetable grid when a schedule is viewed
  const timetableGridRef = useRef<HTMLDivElement>(null);

  // Fetch departments and calendars for dropdowns
  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: () => api.get<Department[]>("/departments"),
  });

  const { data: calendars = [] } = useQuery({
    queryKey: ["calendars"],
    queryFn: () => api.get<Calendar[]>("/calendars"),
  });

  // Sections filtered by selected department
  const { data: sections = [] } = useQuery({
    queryKey: ["sections", deptId],
    queryFn: () => api.get<Section[]>("/sections"),
    enabled: Boolean(deptId),
    select: (data) => (data as Section[]).filter((s) => s.dept_id === deptId || !deptId),
  });

  // Existing timetables list
  const { data: timetables = [], refetch: refetchTimetables } = useQuery({
    queryKey: ["timetables"],
    queryFn: () => api.get<ScheduleRow[]>("/timetables"),
  });

  // Full schedule data for the selected scheduleId
  const schedule = useQuery({
    queryKey: ["schedule", scheduleId],
    enabled: Boolean(scheduleId),
    queryFn: () => api.get<ScheduleRow>(`/timetables/${scheduleId}`),
  });

  // Solver job status polling
  const status = useQuery({
    queryKey: ["schedule-status", scheduleId],
    enabled: Boolean(scheduleId) && (solverProgress === "pending" || solverProgress === "running"),
    refetchInterval: 3000,
    queryFn: () => api.get<SolverJob[]>(`/timetables/${scheduleId}/status`),
  });

  // Timetable grid matrix
  const matrix = useMemo(() => {
    const map = new Map<string, SessionItem>();
    (schedule.data?.sessions ?? []).forEach((item) =>
      map.set(`${item.day}-${item.slot}`, item),
    );
    return map;
  }, [schedule.data?.sessions]);

  // Cells that are consumed by a multi-slot (lab) session rowspan — should not render a <td>
  const skipCells = useMemo(() => {
    const skips = new Set<string>();
    (schedule.data?.sessions ?? []).forEach((s) => {
      const dur = s.duration_slots ?? 1;
      for (let i = 1; i < dur; i++) {
        skips.add(`${s.day}-${s.slot + i}`);
      }
    });
    return skips;
  }, [schedule.data?.sessions]);

  // All unique faculty in current schedule (for faculty view)
  const facultyInSchedule = useMemo(() => {
    const seen = new Map<string, string>();
    (schedule.data?.sessions ?? []).forEach((s) => {
      if (s.faculty_id && typeof s.faculty_id === "object" && s.faculty_id.name) {
        const key = s.faculty_id.name;
        if (!seen.has(key)) seen.set(key, key);
      }
    });
    return Array.from(seen.entries()).map(([k, v]) => ({ label: v, value: k }));
  }, [schedule.data?.sessions]);

  // Authenticated file download (avoids window.open which strips the Bearer token)
  const handleExport = async (path: string, filename: string) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}${path}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        toast.error("Export failed — please try again");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Export failed");
    }
  };

  const generate = useMutation({
    mutationFn: () =>
      api.post<{ scheduleId: string; jobId: string }>("/timetables/generate", {
        semester_id: semesterId,
        dept_id: deptId,
        ...(sectionId ? { section_id: sectionId } : {}),
      }),
    onSuccess: async (data) => {
      setScheduleId(data.scheduleId);
      setSolverProgress("pending");
      setSolverError("");
      toast.success("Generation started — solver is running");
      try {
        await streamSse(`/timetables/${data.scheduleId}/stream`, (event) => {
          const evtData = event.data as { jobs?: Array<{ status: string; error?: string }> };
          const jobStatus = evtData?.jobs?.[0]?.status;
          if (event.type === "running" || jobStatus === "running") {
            setSolverProgress("running");
          } else if (event.type === "completed" || jobStatus === "done") {
            setSolverProgress("done");
            queryClient.invalidateQueries({ queryKey: ["schedule", data.scheduleId] });
            queryClient.invalidateQueries({ queryKey: ["timetables"] });
            refetchTimetables();
          } else if (event.type === "failed" || jobStatus === "failed") {
            const err = evtData?.jobs?.[0]?.error ?? "Solver failed";
            setSolverProgress("failed");
            setSolverError(err);
          }
        });
      } catch {
        // SSE disconnected — fall back to status polling (already enabled)
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setSolverProgress("idle");
    },
  });

  const handleGenerate = () => {
    if (!deptId || !semesterId) {
      toast.error("Please select a department and semester");
      return;
    }
    setSolverProgress("idle");
    generate.mutate();
  };

  const handleAddConstraint = async () => {
    if (!constraintText.trim()) {
      toast.error("Please enter a constraint");
      return;
    }
    if (!semesterId || !deptId) {
      toast.error("Select a department and semester first");
      return;
    }
    setConstraintLoading(true);
    try {
      await api.post("/constraints/parse", {
        raw_text: constraintText,
        semester_id: semesterId,
        dept_id: deptId,
        auto_save: true,
      });
      toast.success("Constraint saved");
      setConstraintText("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save constraint");
    } finally {
      setConstraintLoading(false);
    }
  };

  const deleteSchedule = useMutation({
    mutationFn: (id: string) => api.del(`/timetables/${id}`),
    onSuccess: (_, id) => {
      toast.success("Timetable deleted");
      if (scheduleId === id) {
        setScheduleId("");
        setSolverProgress("idle");
      }
      queryClient.invalidateQueries({ queryKey: ["timetables"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deptOptions = (departments as Department[]).map((d) => ({
    label: `${d.name} (${d.code})`,
    value: d._id,
  }));

  const semesterOptions = (calendars as Calendar[]).map((c) => ({
    label: `${c.year} — Semester ${c.semester}`,
    value: c._id,
  }));

  const sectionOptions = [
    { label: "All students (no section)", value: "" },
    ...(sections as Section[]).map((s) => ({ label: s.name, value: s._id })),
  ];

  const selectedDeptName =
    (departments as Department[]).find((d) => d._id === deptId)?.name ?? "";
  const selectedSemLabel =
    (calendars as Calendar[]).find((c) => c._id === semesterId)
      ? `Semester ${(calendars as Calendar[]).find((c) => c._id === semesterId)!.semester} — ${(calendars as Calendar[]).find((c) => c._id === semesterId)!.year}`
      : "";

  return (
    <div className="space-y-6">
      {/* ── Generate Form ── */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Timetable</CardTitle>
          <p className="text-sm text-muted-foreground">
            Select your department and semester, then click Generate. The optimizer will create an
            optimized timetable automatically.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Department</label>
              <NativeSelect
                options={deptOptions}
                value={deptId}
                onChange={setDeptId}
                placeholder="Select department…"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Semester</label>
              <NativeSelect
                options={semesterOptions}
                value={semesterId}
                onChange={setSemesterId}
                placeholder="Select semester…"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Section (optional)</label>
              <NativeSelect
                options={sectionOptions}
                value={sectionId}
                onChange={setSectionId}
                placeholder="All students"
                disabled={!deptId}
              />
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!deptId || !semesterId || generate.isPending || solverProgress === "running" || solverProgress === "pending"}
          >
            {generate.isPending || solverProgress === "running" || solverProgress === "pending"
              ? "Generating…"
              : "Generate Timetable"}
          </Button>

          {/* Solver progress indicator */}
          {solverProgress !== "idle" && (
            <div className="rounded-md border p-3">
              {solverProgress === "pending" && (
                <p className="text-sm text-muted-foreground">⏳ Waiting for solver to start…</p>
              )}
              {solverProgress === "running" && (
                <p className="text-sm text-muted-foreground">⚙️ Solver is running — building your timetable…</p>
              )}
              {solverProgress === "done" && (
                <p className="text-sm text-green-600 font-medium">
                  ✅ Timetable generated for {selectedDeptName}
                  {selectedSemLabel ? ` — ${selectedSemLabel}` : ""}
                </p>
              )}
              {solverProgress === "failed" && (
                <div>
                  <p className="text-sm font-medium text-destructive">❌ Generation failed</p>
                  {solverError && (
                    <p className="mt-1 text-xs text-muted-foreground">{solverError}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Export buttons — shown when a schedule is selected */}
          {scheduleId && solverProgress === "done" && (
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport(`/exports/${scheduleId}/pdf`, `timetable-${scheduleId}.pdf`)}
              >
                Export PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport(`/exports/${scheduleId}/ical`, `timetable-${scheduleId}.ics`)}
              >
                Export to Calendar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Plain-English Constraint Input ── */}
      {deptId && semesterId && (
        <Card>
          <CardHeader>
            <CardTitle>Add a Scheduling Rule</CardTitle>
            <p className="text-sm text-muted-foreground">
              Describe a scheduling constraint in plain English. The system will parse and save it automatically.
              Saved constraints are <strong>automatically applied</strong> the next time you generate a timetable for this department and semester.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <input
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder='e.g. "Dr. Sharma is not available on Fridays"'
                value={constraintText}
                onChange={(e) => setConstraintText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddConstraint()}
              />
              <Button
                variant="outline"
                onClick={handleAddConstraint}
                disabled={constraintLoading}
              >
                {constraintLoading ? "Saving…" : "Add Rule"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Existing Timetables List ── */}
      {(timetables as ScheduleRow[]).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Existing Timetables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(timetables as ScheduleRow[]).map((t) => {
                const deptName =
                  typeof t.dept_id === "object"
                    ? (t.dept_id?.name ?? t.dept_id?.code ?? "—")
                    : "—";
                const semLabel =
                  typeof t.semester_id === "object"
                    ? `${t.semester_id?.year ?? ""} Sem ${t.semester_id?.semester ?? ""}`
                    : "—";
                const createdAt = t.created_at
                  ? new Date(t.created_at).toLocaleString("en-IN", {
                      day: "2-digit", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })
                  : null;
                return (
                  <div
                    key={t._id}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">
                        {deptName} — {semLabel}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={t.status} />
                        {createdAt && (
                          <span className="text-xs text-muted-foreground">{createdAt}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setScheduleId(t._id);
                          setSolverProgress("done");
                          setSelectedFaculty("");
                          setTimeout(() => timetableGridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
                        }}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport(`/exports/${t._id}/pdf`, `timetable-${t._id}.pdf`)}
                      >
                        PDF
                      </Button>
                      {t.status !== "published" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 px-2"
                          onClick={() => {
                            if (confirm("Delete this timetable?")) deleteSchedule.mutate(t._id);
                          }}
                          disabled={deleteSchedule.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Timetable Grid ── */}
      {scheduleId && (
        <div ref={timetableGridRef}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle>Timetable Grid</CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={viewMode === "grid" ? "default" : "outline"}
                  onClick={() => setViewMode("grid")}
                >
                  Grid View
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "faculty" ? "default" : "outline"}
                  onClick={() => setViewMode("faculty")}
                >
                  Faculty View
                </Button>
              </div>
            </div>
            {viewMode === "faculty" && facultyInSchedule.length > 0 && (
              <div className="mt-2">
                <NativeSelect
                  options={facultyInSchedule}
                  value={selectedFaculty}
                  onChange={setSelectedFaculty}
                  placeholder="Select faculty member…"
                />
              </div>
            )}
          </CardHeader>
          <CardContent>
            {schedule.isLoading && (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading timetable…</p>
            )}

            {!schedule.isLoading && viewMode === "grid" && (
              <div className="overflow-auto">
                <table className="w-full min-w-160 border-collapse text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="border px-3 py-2 text-left font-medium text-muted-foreground">
                        Time
                      </th>
                      {DAYS.map((day) => (
                        <th key={day} className="border px-3 py-2 font-medium">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SLOTS.map((slot, slotIndex) => (
                      <tr key={slot.start} className="hover:bg-muted/20 transition-colors">
                        <td className="border px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">
                          {slot.label}
                        </td>
                        {DAYS.map((_, dayIndex) => {
                          const cellKey = `${dayIndex + 1}-${slotIndex}`;
                          if (skipCells.has(cellKey)) return null;
                          const item = matrix.get(cellKey);
                          const dur = item?.duration_slots ?? 1;
                          return (
                            <td
                              key={`${slot.start}-${dayIndex}`}
                              rowSpan={dur > 1 ? dur : undefined}
                              className="border px-2 py-1.5 align-top min-w-28"
                            >
                              {item ? (
                                <div className={`rounded px-2 py-1 h-full ${dur > 1 ? "bg-blue-50 border-l-2 border-blue-400" : "bg-primary/10"}`}>
                                  <p className="font-medium text-xs">
                                    {getSessionLabel(item.subject_id)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {getFacultyLabel(item.faculty_id)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {getSessionLabel(item.room_id)}
                                  </p>
                                  {dur > 1 && (
                                    <p className="text-xs text-blue-500 font-medium mt-0.5">{dur}h Lab</p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground/30 text-xs">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!schedule.isLoading && viewMode === "faculty" && (
              <div className="space-y-2">
                {!selectedFaculty ? (
                  <p className="py-4 text-sm text-muted-foreground">
                    Select a faculty member above to see their schedule.
                  </p>
                ) : (() => {
                  const facultySessions = (schedule.data?.sessions ?? [])
                    .filter(
                      (s) =>
                        typeof s.faculty_id === "object" &&
                        s.faculty_id?.name === selectedFaculty,
                    )
                    .sort((a, b) => a.day * 10 + a.slot - (b.day * 10 + b.slot));
                  return (
                    <>
                      <h4 className="font-medium">{selectedFaculty}&apos;s Schedule</h4>
                      {facultySessions.length === 0 ? (
                        <p className="py-4 text-sm text-muted-foreground">
                          No sessions found for {selectedFaculty}.
                        </p>
                      ) : (
                        facultySessions.map((s, i) => (
                          <div key={i} className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
                            <span className="w-10 font-medium text-muted-foreground">
                              {DAYS[(s.day ?? 1) - 1]}
                            </span>
                            <span className="w-28 text-muted-foreground">
                              {SLOTS[s.slot ?? 0]?.label ?? `Slot ${s.slot}`}
                            </span>
                            <span className="font-medium">{getSessionLabel(s.subject_id)}</span>
                            <span className="text-muted-foreground">{getSessionLabel(s.room_id)}</span>
                          </div>
                        ))
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {/* Solver status info — only shown during/after a fresh generation */}
            {scheduleId && solverProgress !== "idle" && Array.isArray(status.data) && status.data.length > 0 && (
              <div className="mt-4 flex items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
                <span>Solver:</span>
                <StatusBadge status={(status.data[0] as SolverJob).status} />
                {(status.data[0] as SolverJob).duration_ms && (
                  <span>· Solved in {(((status.data[0] as SolverJob).duration_ms ?? 0) / 1000).toFixed(1)}s</span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      )}
    </div>
  );
}
