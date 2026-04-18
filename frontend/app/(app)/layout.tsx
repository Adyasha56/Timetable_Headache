"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
    }
  }, [router]);

  return <AppShell>{children}</AppShell>;
}
