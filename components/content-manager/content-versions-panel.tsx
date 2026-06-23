"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import { getDisplayError } from "@/lib/validation";
import { createVersionEntry } from "@/services/content-manager/content-version.service";

export function ContentVersionsPanel({ museumId }: { museumId: number }) {
  const router = useRouter();
  const [versionNumber, setVersionNumber] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!versionNumber.trim()) {
      setError("Version number is required.");
      return;
    }
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    try {
      await createVersionEntry(versionNumber.trim(), description.trim(), museumId);
      setSuccess(`Version ${versionNumber} created.`);
      setVersionNumber("");
      setDescription("");
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Unable to create content version."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 px-8 pb-10">
      <div>
        <h2 className="text-2xl font-semibold" style={{ fontFamily: cinzel, color: T.text }}>
          Content Versions
        </h2>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-xl rounded-3xl p-6"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm" style={{ color: T.muted }}>Version number *</label>
            <input
              value={versionNumber}
              onChange={(e) => setVersionNumber(e.target.value)}
              placeholder="1.0.0"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm" style={{ color: T.muted }}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
            />
          </div>
        </div>
        {error && <p className="mt-4 text-sm" style={{ color: "#8B2E2E" }}>{error}</p>}
        {success && <p className="mt-4 text-sm" style={{ color: T.success }}>{success}</p>}
        <div className="mt-5 flex justify-end">
          <button type="submit" disabled={isSubmitting} className="rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-50" style={{ background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`, color: T.surface }}>
            {isSubmitting ? "Creating…" : "Create version"}
          </button>
        </div>
      </form>
    </div>
  );
}
