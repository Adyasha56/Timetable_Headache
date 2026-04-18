"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { streamSse } from "@/lib/stream";
import { DAYS, SLOTS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SessionItem = {
  day: number;
  slot: number;
  subject_id?: { name?: string; code?: string };
  faculty_id?: { name?: string };
  room_id?: { name?: string };
};

export function TimetablePanel() {
  const [semesterId, setSemesterId] = useState("");
  const [deptId, setDeptId] = useState("");
  const [scheduleId, setScheduleId] = useState("");
  const [events, setEvents] = useState<Array<{ type: string; data: unknown }>>([]);

  const generate = useMutation({
    mutationFn: () => api.post<{ scheduleId: string; jobId: string }>("/timetables/generate", { semester_id: semesterId, dept_id: deptId }),
    onSuccess: async (data) => {
      setScheduleId(data.scheduleId);
      toast.success("Generation started");
      setEvents([]);
      try {
        await streamSse(`/timetables/${data.scheduleId}/stream`, (event) =>
          setEvents((prev) => [...prev.slice(-24), event]),
        );
      } catch {
        toast.info("SSE stream disconnected. You can still use status polling.");
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const status = useQuery({
    queryKey: ["schedule-status", scheduleId],
    enabled: Boolean(scheduleId),
    refetchInterval: 4000,
    queryFn: () => api.get(`/timetables/${scheduleId}/status`),
  });

  const schedule = useQuery({
    queryKey: ["schedule", scheduleId],
    enabled: Boolean(scheduleId),
    queryFn: () => api.get<{ sessions: SessionItem[] }>(`/timetables/${scheduleId}`),
  });

  const matrix = useMemo(() => {
    const map = new Map<string, SessionItem>();
    (schedule.data?.sessions ?? []).forEach((item) => map.set(`${item.day}-${item.slot}`, item));
    return map;
  }, [schedule.data?.sessions]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Generate Timetable</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Input placeholder="Semester Id" value={semesterId} onChange={(e) => setSemesterId(e.target.value)} />
          <Input placeholder="Department Id" value={deptId} onChange={(e) => setDeptId(e.target.value)} />
          <Button onClick={() => generate.mutate()} disabled={!semesterId || !deptId || generate.isPending}>
            Start Generation
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Job Status + SSE events</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Schedule Id: {scheduleId || "-"}</p>
          <pre className="overflow-auto rounded bg-muted p-3">{JSON.stringify(status.data ?? [], null, 2)}</pre>
          <pre className="overflow-auto rounded bg-muted p-3">{JSON.stringify(events, null, 2)}</pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Grid View</CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border p-2">Slot</th>
                {DAYS.map((day) => (
                  <th key={day} className="border p-2">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SLOTS.map((time, slot) => (
                <tr key={time}>
                  <td className="border p-2 font-medium">{time}</td>
                  {DAYS.map((_, dayIndex) => {
                    const item = matrix.get(`${dayIndex + 1}-${slot}`);
                    return (
                      <td key={`${time}-${dayIndex}`} className="border p-2 align-top">
                        <p>{item?.subject_id?.code ?? "-"}</p>
                        <p className="text-xs text-muted-foreground">{item?.faculty_id?.name ?? ""}</p>
                        <p className="text-xs text-muted-foreground">{item?.room_id?.name ?? ""}</p>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
