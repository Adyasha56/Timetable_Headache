"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, Check, X } from "lucide-react";
import { api } from "@/lib/api";
import type { ResourceConfig, FieldDef } from "@/lib/resources";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/select-native";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type RowRecord = Record<string, unknown> & { _id?: string; id?: string };

// Serialize a value for display in a table cell
function serializeValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") {
    // Format ISO date strings nicely
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return new Date(value).toLocaleDateString();
    }
    return value;
  }
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    return value.map((v) => serializeValue(v)).join(", ") || "—";
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    // Try common display properties in priority order
    const display =
      obj.name ??
      obj.code ??
      obj.label ??
      obj.title ??
      obj.email ??
      (obj.year !== undefined && obj.semester !== undefined
        ? `${obj.year} Sem ${obj.semester}`
        : undefined);
    return display !== undefined ? String(display) : "—";
  }
  return "—";
}

// A select field that fetches its own options from the API
function RemoteSelectField({
  field,
  value,
  onChange,
}: {
  field: FieldDef & { optionsEndpoint: string };
  value: string;
  onChange: (v: string) => void;
}) {
  const { data = [] } = useQuery({
    queryKey: ["select-options", field.optionsEndpoint],
    queryFn: () => api.get<RowRecord[]>(field.optionsEndpoint!),
    staleTime: 60_000,
  });

  const options = (data as RowRecord[]).map((item) => {
    const label = field.optionLabelFormat
      ? field.optionLabelFormat(item as Record<string, unknown>)
      : String(item[field.optionLabel ?? "name"] ?? item._id ?? "");
    return { label, value: String(item[field.optionValue ?? "_id"] ?? "") };
  });

  return (
    <NativeSelect
      options={options}
      value={value}
      onChange={onChange}
      placeholder={field.placeholder ?? `Select ${field.label.toLowerCase()}…`}
    />
  );
}

// A select field with static options baked into the field definition
function StaticSelectField({
  field,
  value,
  onChange,
}: {
  field: FieldDef & { options: Array<{ label: string; value: string }> };
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <NativeSelect
      options={field.options}
      value={value}
      onChange={onChange}
      placeholder={field.placeholder ?? `Select ${field.label.toLowerCase()}…`}
    />
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string;
  onChange: (v: string) => void;
}) {
  const f = field;

  if (f.type === "select") {
    if (f.optionsEndpoint) {
      return (
        <RemoteSelectField
          field={f as FieldDef & { optionsEndpoint: string }}
          value={value}
          onChange={onChange}
        />
      );
    }
    if (f.options) {
      return (
        <StaticSelectField
          field={f as FieldDef & { options: Array<{ label: string; value: string }> }}
          value={value}
          onChange={onChange}
        />
      );
    }

  }

  if (f.type === "textarea") {
    return (
      <Textarea
        placeholder={f.placeholder ?? f.label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
      />
    );
  }

  return (
    <Input
      type={f.type ?? "text"}
      placeholder={f.placeholder ?? f.label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function ResourcePanel({ config }: { config: ResourceConfig }) {
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState<Record<string, string>>({});
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

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
      toast.success(`${config.title.replace(/s$/, "")} saved`);
      setFormState({});
      queryClient.invalidateQueries({ queryKey });
      // Also invalidate select-options caches so dropdowns refresh
      queryClient.invalidateQueries({ queryKey: ["select-options", config.endpoint] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.del(`${config.endpoint}/${id}`),
    onSuccess: () => {
      toast.success("Record deleted");
      setPendingDeleteId(null);
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["select-options", config.endpoint] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setPendingDeleteId(null);
    },
  });

  const handleCreate = () => {
    const missing = config.fields.filter((f) => !formState[f.key] || formState[f.key] === "");
    if (missing.length > 0 && config.fields.length > 0) {
      toast.error(`Please fill in: ${missing.map((f) => f.label).join(", ")}`);
      return;
    }
    createMutation.mutate();
  };

  // Use config-defined display columns, falling back to field keys
  const displayColumns = useMemo(
    () =>
      config.displayColumns ??
      config.fields.slice(0, 5).map((f) => ({ key: f.key, label: f.label })),
    [config.displayColumns, config.fields],
  );

  return (
    <div className="space-y-6">
      {config.fields.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Add New {config.title.replace(/s$/, "")}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {config.fields.map((field) => (
              <div
                key={field.key}
                className={field.type === "textarea" ? "sm:col-span-2" : ""}
              >
                <div className="mb-1 flex items-center gap-1">
                  <label className="text-sm font-medium">{field.label}</label>
                  {field.helpText && (
                    <span
                      title={field.helpText}
                      className="cursor-help text-xs text-muted-foreground"
                    >
                      ⓘ
                    </span>
                  )}
                </div>
                <FieldInput
                  field={field}
                  value={formState[field.key] ?? ""}
                  onChange={(v) => setFormState((prev) => ({ ...prev, [field.key]: v }))}
                />
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Saving…" : `Add ${config.title.replace(/s$/, "")}`}
            </Button>
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            {displayColumns.map((col) => (
              <TableHead key={col.key}>{col.label}</TableHead>
            ))}
            {config.fields.length > 0 && <TableHead className="w-28">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={displayColumns.length + 1} className="py-8 text-center text-muted-foreground">
                Loading…
              </TableCell>
            </TableRow>
          )}
          {!isLoading && (data as RowRecord[]).length === 0 && (
            <TableRow>
              <TableCell colSpan={displayColumns.length + 1}>
                <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                  <p className="text-sm font-medium">{config.emptyMessage ?? "No records found."}</p>
                </div>
              </TableCell>
            </TableRow>
          )}
          {(data as RowRecord[]).map((row) => {
            const id = String(row._id ?? row.id ?? "");
            const isPendingDelete = pendingDeleteId === id;
            return (
              <TableRow key={id}>
                {displayColumns.map((col) => (
                  <TableCell key={`${id}-${col.key}`} className="max-w-50 truncate">
                    {serializeValue(row[col.key])}
                  </TableCell>
                ))}
                {config.fields.length > 0 && (
                  <TableCell>
                    {isPendingDelete ? (
                      <div className="flex gap-1">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteMutation.mutate(id)}
                          disabled={deleteMutation.isPending}
                          title="Confirm delete"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPendingDeleteId(null)}
                          title="Cancel"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 px-2"
                        onClick={() => id && setPendingDeleteId(id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
