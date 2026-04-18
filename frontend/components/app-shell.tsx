"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { clearSession, getUser, type SessionUser } from "@/lib/auth";

const routes = [
  "departments",
  "users",
  "faculty",
  "subjects",
  "rooms",
  "sections",
  "calendars",
  "constraints",
  "timetables",
  "overrides",
  "notifications",
  "audit",
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
          <div>
            <p className="text-sm text-muted-foreground">Timetable Optimizer</p>
            <h1 className="text-xl font-semibold">Operations Console</h1>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              {user?.name} ({user?.role})
            </p>
            <Button
              variant="outline"
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
        <aside className="col-span-12 rounded-lg border bg-background p-3 md:col-span-3">
          <nav className="grid gap-1">
            {routes.map((route) => (
              <Link
                key={route}
                href={`/${route}`}
                className={cn(
                  "rounded-md px-3 py-2 text-sm capitalize hover:bg-muted",
                  pathname === `/${route}` && "bg-primary text-primary-foreground",
                )}
              >
                {route.replace("-", " ")}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="col-span-12 rounded-lg border bg-background p-4 md:col-span-9">
          {children}
        </main>
      </div>
    </div>
  );
}
