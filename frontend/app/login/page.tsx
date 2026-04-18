"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { saveSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type LoginResponse = {
  token: string;
  user: { id: string; name: string; email: string; role: "admin" | "hod" | "faculty" | "staff" };
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@gift.edu.in");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    setLoading(true);
    try {
      const data = await api.post<LoginResponse>("/auth/login", { email, password });
      saveSession(data.token, data.user);
      toast.success("Welcome back");
      router.push("/departments");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in to Timetable Optimizer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
          <Button className="w-full" onClick={login} disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
