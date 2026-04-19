"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getUser, type SessionUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type CountResult = { total?: number } | unknown[];

function useCount(endpoint: string) {
  const { data, isLoading } = useQuery({
    queryKey: ["count", endpoint],
    queryFn: () => api.get<CountResult>(endpoint),
  });
  if (isLoading) return null;
  if (Array.isArray(data)) return data.length;
  if (data && typeof data === "object" && "total" in (data as object)) {
    return (data as { total: number }).total;
  }
  return 0;
}

type SetupItem = {
  label: string;
  href: string;
  count: number | null;
  description: string;
  required: boolean;
};

function SetupStep({
  item,
  index,
}: {
  item: SetupItem;
  index: number;
}) {
  const isReady = item.count !== null && item.count > 0;
  const isLoading = item.count === null;

  return (
    <Link
      href={item.href}
      className="flex items-start gap-3 rounded-md p-3 hover:bg-muted/50 transition-colors"
    >
      <div
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          isLoading
            ? "bg-muted text-muted-foreground"
            : isReady
            ? "bg-green-100 text-green-700"
            : item.required
            ? "bg-amber-100 text-amber-700"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {isLoading ? "…" : isReady ? "✓" : index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">{item.label}</p>
          {!isLoading && (
            <span className="text-xs text-muted-foreground shrink-0">
              {isReady ? `${item.count} added` : item.required ? "⚠ Required" : "Optional"}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const deptCount = useCount("/departments");
  const facultyCount = useCount("/faculty");
  const subjectCount = useCount("/subjects");
  const roomCount = useCount("/rooms");
  const calendarCount = useCount("/calendars");
  const timetableCount = useCount("/timetables");

  const setupItems: SetupItem[] = [
    {
      label: "Departments",
      href: "/departments",
      count: deptCount,
      description: "Add your institution's academic departments first.",
      required: true,
    },
    {
      label: "Rooms",
      href: "/rooms",
      count: roomCount,
      description: "Add classrooms, labs, and halls available for scheduling.",
      required: true,
    },
    {
      label: "Faculty Members",
      href: "/faculty",
      count: facultyCount,
      description: "Add teaching staff who will be assigned to classes.",
      required: true,
    },
    {
      label: "Subjects",
      href: "/subjects",
      count: subjectCount,
      description: "Add courses with their weekly session requirements.",
      required: true,
    },
    {
      label: "Academic Calendar",
      href: "/calendars",
      count: calendarCount,
      description: "Define the semester dates for your institution.",
      required: true,
    },
    {
      label: "Sections (optional)",
      href: "/sections",
      count: null, // don't block on this
      description: "Add student sections if you split batches.",
      required: false,
    },
  ];

  const allRequiredReady = [deptCount, roomCount, facultyCount, subjectCount, calendarCount].every(
    (c) => c !== null && c > 0,
  );

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-semibold">
          Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {user?.role && (
            <span className="capitalize font-medium">{user.role}</span>
          )}
          {" "}— Timetable Optimizer
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Setup Checklist */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Setup Checklist</CardTitle>
            <p className="text-xs text-muted-foreground">
              Complete these steps before generating a timetable.
            </p>
          </CardHeader>
          <CardContent className="divide-y">
            {setupItems.map((item, i) => (
              <SetupStep key={item.href} item={item} index={i} />
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions + Summary */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full justify-start"
                onClick={() => router.push("/timetables")}
                disabled={!allRequiredReady}
              >
                Generate Timetable
                {!allRequiredReady && (
                  <span className="ml-auto text-xs opacity-70">Complete setup first</span>
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push("/overrides")}
              >
                Record Faculty Absence
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push("/constraints")}
              >
                Add Scheduling Rules
              </Button>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">At a Glance</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-3">
                {[
                  { label: "Departments", value: deptCount },
                  { label: "Faculty", value: facultyCount },
                  { label: "Subjects", value: subjectCount },
                  { label: "Rooms", value: roomCount },
                  { label: "Calendars", value: calendarCount },
                  { label: "Timetables", value: timetableCount },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-md bg-muted/50 px-3 py-2">
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="text-xl font-semibold">
                      {value === null ? "…" : value}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
