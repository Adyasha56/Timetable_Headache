"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { clearSession, getUser, type SessionUser } from "@/lib/auth";
import { api } from "@/lib/api";

const NAV_GROUPS = [
  {
    label: "Home",
    routes: [{ path: "dashboard", label: "Dashboard" }],
  },
  {
    label: "Setup",
    routes: [
      { path: "departments", label: "Departments" },
      { path: "rooms", label: "Rooms" },
      { path: "faculty", label: "Faculty" },
      { path: "subjects", label: "Subjects" },
    ],
  },
  {
    label: "Scheduling",
    routes: [
      { path: "calendars", label: "Academic Calendar" },
      { path: "sections", label: "Sections" },
      { path: "constraints", label: "Constraints" },
      { path: "timetables", label: "Timetables" },
    ],
  },
  {
    label: "Daily Operations",
    routes: [{ path: "overrides", label: "Overrides" }],
  },
  {
    label: "Admin",
    routes: [
      { path: "users", label: "Users" },
      { path: "notifications", label: "Notifications" },
      { path: "audit", label: "Audit Log" },
    ],
  },
];

function UserInitials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
      {initials}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const { data: notifCount } = useQuery({
    queryKey: ["notif-count"],
    queryFn: () => api.get<{ count: number }>("/notifications/unread-count"),
    refetchInterval: 30_000,
    enabled: Boolean(user),
  });

  const unread = (notifCount as { count?: number } | null)?.count ?? 0;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Timetable Optimizer
            </p>
            <Link href="/dashboard" className="text-lg font-semibold hover:text-primary transition-colors">
              Operations Console
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <Link
              href="/notifications"
              className="relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Notifications"
            >
              <span className="text-base">🔔</span>
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>

            {/* User info */}
            {user && (
              <div className="flex items-center gap-2">
                <UserInitials name={user.name ?? "U"} />
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                clearSession();
                router.push("/login");
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-4 p-4">
        {/* Sidebar */}
        <aside className="col-span-12 md:col-span-3">
          <div className="rounded-lg border bg-background p-3">
            {/* Mobile: horizontal scrollable pills */}
            <nav className="flex gap-1 overflow-x-auto pb-1 md:hidden">
              {NAV_GROUPS.flatMap((g) => g.routes).map((route) => (
                <Link
                  key={route.path}
                  href={`/${route.path}`}
                  className={cn(
                    "shrink-0 rounded-md px-3 py-1.5 text-sm whitespace-nowrap transition-colors duration-150 hover:bg-muted",
                    pathname === `/${route.path}` && "bg-primary text-primary-foreground",
                  )}
                >
                  {route.label}
                </Link>
              ))}
            </nav>

            {/* Desktop: grouped vertical nav */}
            <nav className="hidden md:block space-y-4">
              {NAV_GROUPS.map((group, gi) => (
                <div key={group.label}>
                  {gi > 0 && <Separator className="mb-3" />}
                  <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </p>
                  <div className="grid gap-0.5">
                    {group.routes.map((route) => (
                      <Link
                        key={route.path}
                        href={`/${route.path}`}
                        className={cn(
                          "rounded-md px-3 py-2 text-sm transition-colors duration-150 hover:bg-muted",
                          pathname === `/${route.path}`
                            ? "bg-primary text-primary-foreground font-medium"
                            : "text-foreground",
                        )}
                      >
                        {route.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="col-span-12 min-h-[calc(100vh-8rem)] rounded-lg border bg-background p-5 md:col-span-9">
          {children}
        </main>
      </div>
    </div>
  );
}
