"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import { updateConfigEntry } from "@/services/admin";
import { getDisplayError } from "@/lib/validation";
import type { SystemConfigDto } from "@/types/api";

type EditableConfig = SystemConfigDto & {
  draftValue: string;
  draftDescription: string;
};

export function SystemConfigPanel({ configs }: { configs: SystemConfigDto[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<EditableConfig[]>(
    configs.map((config) => ({
      ...config,
      draftValue: config.configValue,
      draftDescription: config.description ?? "",
    })),
  );
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successKey, setSuccessKey] = useState<string | null>(null);

  function updateDraft(id: number, field: "draftValue" | "draftDescription", value: string) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  }

  async function handleSave(config: EditableConfig) {
    setSavingKey(config.configKey);
    setError(null);
    setSuccessKey(null);

    try {
      await updateConfigEntry(config.configKey, {
        configValue: config.draftValue,
        description: config.draftDescription.trim() || undefined,
      });
      setSuccessKey(config.configKey);
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Unable to update configuration."));
    } finally {
      setSavingKey(null);
    }
  }

  const isDirty = (config: EditableConfig) =>
    config.draftValue !== config.configValue ||
    config.draftDescription !== (config.description ?? "");

  return (
    <div className="space-y-6 px-8 pb-10">
      <div>
        <p className="text-2xl font-semibold" style={{ fontFamily: cinzel, color: T.text }}>
          {configs.length} configuration{configs.length === 1 ? "" : "s"}
        </p>
      </div>

      {error && (
        <p
          className="rounded-xl px-4 py-3 text-sm"
          style={{ background: "rgba(180,40,40,0.08)", color: "#8B2E2E" }}
        >
          {error}
        </p>
      )}

      <div className="space-y-4">
        {rows.length === 0 ? (
          <div
            className="rounded-3xl px-8 py-16 text-center"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}
          >
            <p className="text-sm" style={{ color: T.muted }}>
              No system configurations returned from the API.
            </p>
          </div>
        ) : (
          rows.map((config) => (
            <div
              key={config.id}
              className="rounded-3xl p-6"
              style={{ background: T.surface, border: `1px solid ${T.border}` }}
            >
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-sm font-semibold" style={{ color: T.text }}>
                    {config.configKey}
                  </p>
                  {successKey === config.configKey && (
                    <p className="mt-1 text-xs" style={{ color: T.success }}>
                      Saved successfully.
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleSave(config)}
                  disabled={!isDirty(config) || savingKey === config.configKey}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-40"
                  style={{
                    background: isDirty(config)
                      ? `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`
                      : "rgba(200,155,69,0.12)",
                    color: isDirty(config) ? T.surface : T.muted,
                  }}
                >
                  <Save className="h-4 w-4" />
                  {savingKey === config.configKey ? "Saving…" : "Save"}
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-sm" style={{ color: T.muted }}>
                    Config value
                  </label>
                  <input
                    value={config.draftValue}
                    onChange={(e) => updateDraft(config.id, "draftValue", e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 font-mono text-sm outline-none"
                    style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm" style={{ color: T.muted }}>
                    Description
                  </label>
                  <input
                    value={config.draftDescription}
                    onChange={(e) =>
                      updateDraft(config.id, "draftDescription", e.target.value)
                    }
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                    style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
