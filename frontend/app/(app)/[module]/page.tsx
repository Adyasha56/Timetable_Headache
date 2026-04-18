"use client";

import { notFound } from "next/navigation";
import { useParams } from "next/navigation";
import { resources } from "@/lib/resources";
import { ResourcePanel } from "@/components/resource-panel";
import { TimetablePanel } from "@/components/timetable-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useState } from "react";
import { toast } from "sonner";

function QuickActions() {
  const [rawText, setRawText] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [deptId, setDeptId] = useState("");
  const [scheduleId, setScheduleId] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integrated route actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 md:grid-cols-3">
          <Input placeholder="semester_id" value={semesterId} onChange={(e) => setSemesterId(e.target.value)} />
          <Input placeholder="dept_id" value={deptId} onChange={(e) => setDeptId(e.target.value)} />
          <Button
            variant="outline"
            onClick={async () => {
              const data = await api.get("/faculty/suggest-allocation", { semester_id: semesterId, dept_id: deptId });
              toast.success(`Allocation suggestions fetched: ${Array.isArray(data) ? data.length : 1}`);
            }}
          >
            Faculty Suggestion
          </Button>
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          <Input
            placeholder="Constraint sentence for /constraints/parse"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
          <Button
            variant="outline"
            onClick={async () => {
              await api.post("/constraints/parse", { raw_text: rawText, semester_id: semesterId, dept_id: deptId, auto_save: true });
              toast.success("Constraint parsed and saved");
            }}
          >
            Parse Constraint
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              await api.post("/calendars/rollover", {
                from_semester_id: semesterId,
                to_year: new Date().getFullYear() + 1,
                to_semester: 1,
                start_date: `${new Date().getFullYear() + 1}-07-01`,
                end_date: `${new Date().getFullYear() + 1}-11-30`,
                copy_constraints: true,
              });
              toast.success("Rollover completed");
            }}
          >
            New Semester Rollover
          </Button>
        </div>
        <div className="grid gap-2 md:grid-cols-4">
          <Input placeholder="schedule_id" value={scheduleId} onChange={(e) => setScheduleId(e.target.value)} />
          <Button variant="outline" onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1"}/exports/${scheduleId}/pdf`, "_blank")}>
            Export PDF
          </Button>
          <Button variant="outline" onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1"}/exports/${scheduleId}/ical`, "_blank")}>
            Export iCal
          </Button>
          <Button variant="outline" onClick={async () => {
            await api.patch("/notifications/mark-all-read", {});
            toast.success("All notifications marked read");
          }}>
            Mark Notifications Read
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ModulePage() {
  const params = useParams();
  const moduleName = params.module as string;
  if (moduleName === "timetables") {
    return (
      <div className="space-y-4">
        <TimetablePanel />
        <QuickActions />
      </div>
    );
  }

  const config = resources[moduleName];
  if (!config) return notFound();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">{config.title}</h2>
        <p className="text-sm text-muted-foreground">
          CRUD interface mapped to `{config.endpoint}`
        </p>
      </div>
      <ResourcePanel config={config} />
      <QuickActions />
    </div>
  );
}
