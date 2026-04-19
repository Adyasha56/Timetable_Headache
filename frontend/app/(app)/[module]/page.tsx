"use client";

import { notFound, useParams } from "next/navigation";
import { resources } from "@/lib/resources";
import { ResourcePanel } from "@/components/resource-panel";
import { TimetablePanel } from "@/components/timetable-panel";

export default function ModulePage() {
  const params = useParams();
  const moduleName = params.module as string;

  if (moduleName === "timetables") {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Scheduling</p>
          <h2 className="text-2xl font-semibold">Timetables</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Generate and view optimized timetables for your departments.
          </p>
        </div>
        <TimetablePanel />
      </div>
    );
  }

  const config = resources[moduleName];
  if (!config) return notFound();

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
          {getGroupLabel(moduleName)}
        </p>
        <h2 className="text-2xl font-semibold">{config.title}</h2>
        {config.description && (
          <p className="text-sm text-muted-foreground mt-0.5">{config.description}</p>
        )}
      </div>
      <ResourcePanel config={config} />
    </div>
  );
}

function getGroupLabel(module: string): string {
  const groups: Record<string, string> = {
    departments: "Setup",
    rooms: "Setup",
    faculty: "Setup",
    subjects: "Setup",
    sections: "Scheduling",
    calendars: "Scheduling",
    constraints: "Scheduling",
    overrides: "Daily Operations",
    users: "Admin",
    audit: "Admin",
    notifications: "Admin",
  };
  return groups[module] ?? "";
}
