"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { ResourceConfig } from "@/lib/resources";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type RowRecord = Record<string, unknown> & { _id?: string; id?: string };

// Helper to serialize objects and avoid "[object Object]" display
function serializeValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "object") {
    if (Array.isArray(value)) {
      return value.map(v => serializeValue(v)).join(", ") || "-";
    }
    const obj = value as Record<string, unknown>;
    // Try common display properties
    const displayValue = obj.name || obj.code || obj.label || obj.title || JSON.stringify(obj);
    return String(displayValue);
  }
  return "-";
}

export function ResourcePanel({ config }: { config: ResourceConfig }) {
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState<Record<string, string>>({});

  const queryKey = ["resource", config.endpoint];
  const { data = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => api.get<RowRecord[]>(config.endpoint, config.queryHints),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = Object.fromEntries(
        Object.entries(formState).filter(([, value]) => value !== ""),
      );
      return api.post(config.endpoint, payload);
    },
    onSuccess: () => {
      toast.success(`${config.title} saved`);
      setFormState({});
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.del(`${config.endpoint}/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: (error: Error) => toast.error(error.message),
  });

  const columns = useMemo(() => {
    if (!data.length) return config.fields.slice(0, 3).map((item) => item.key);
    return Object.keys(data[0]).filter((key) => !["_id", "__v"].includes(key)).slice(0, 5);
  }, [config.fields, data]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        {config.fields.map((field) => (
          <div key={field.key} className={field.type === "textarea" ? "md:col-span-2" : ""}>
            {field.type === "textarea" ? (
              <Textarea
                placeholder={field.placeholder ?? field.label}
                value={formState[field.key] ?? ""}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, [field.key]: event.target.value }))
                }
              />
            ) : (
              <Input
                type={field.type ?? "text"}
                placeholder={field.placeholder ?? field.label}
                value={formState[field.key] ?? ""}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, [field.key]: event.target.value }))
                }
              />
            )}
          </div>
        ))}
      </div>
      {config.fields.length > 0 && (
        <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
          Create {config.title.slice(0, -1)}
        </Button>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column} className="capitalize">
                {column.replaceAll("_", " ")}
              </TableHead>
            ))}
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={columns.length + 1}>Loading...</TableCell>
            </TableRow>
          )}
          {!isLoading && data.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length + 1}>No records found.</TableCell>
            </TableRow>
          )}
          {data.map((row) => {
            const id = String(row._id ?? row.id ?? "");
            return (
              <TableRow key={id}>
                {columns.map((column) => (
                  <TableCell key={`${id}-${column}`}>{serializeValue(row[column])}</TableCell>
                ))}
                <TableCell>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => id && deleteMutation.mutate(id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
