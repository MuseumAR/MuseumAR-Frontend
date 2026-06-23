"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import { getDisplayError } from "@/lib/validation";
import { createExhibitionEntry } from "@/services/content-manager/exhibition.service";
import type { ExhibitionDto } from "@/types/api";

function StatusBadge({ status }: { status: string }) {
  const active = status === "Active";
  const upcoming = status === "Upcoming";
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{
        background: active
          ? "rgba(79,125,74,0.12)"
          : upcoming
            ? "rgba(200,155,69,0.15)"
            : "rgba(109,90,69,0.12)",
        color: active ? T.success : upcoming ? T.primaryDark : T.muted,
      }}
    >
      {status}
    </span>
  );
}

export function ExhibitionPanel({
  exhibitions,
  museumId,
}: {
  exhibitions: ExhibitionDto[];
  museumId: number;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("Upcoming");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await createExhibitionEntry({
        museumId,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status,
      });
      setShowForm(false);
      setStartDate("");
      setEndDate("");
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Unable to create exhibition."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 px-8 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-2xl font-semibold" style={{ fontFamily: cinzel, color: T.text }}>
            {exhibitions.length} exhibition{exhibitions.length === 1 ? "" : "s"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-medium"
          style={{
            background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
            color: T.surface,
          }}
        >
          <Plus className="h-4 w-4" />
          {showForm ? "Close" : "Create exhibition"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl p-6"
          style={{ background: T.surface, border: `1px solid ${T.border}` }}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="block text-sm" style={{ color: T.muted }}>Start date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm outline-none" style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm" style={{ color: T.muted }}>End date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm outline-none" style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm" style={{ color: T.muted }}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm outline-none" style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}>
                <option value="Upcoming">Upcoming</option>
                <option value="Active">Active</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>
          {error && <p className="mt-4 text-sm" style={{ color: "#8B2E2E" }}>{error}</p>}
          <div className="mt-4 flex justify-end">
            <button type="submit" disabled={isSubmitting} className="rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-50" style={{ background: T.primary, color: T.surface }}>
              {isSubmitting ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {exhibitions.length === 0 ? (
          <p className="text-sm" style={{ color: T.muted }}>No exhibitions yet.</p>
        ) : (
          exhibitions.map((item) => (
            <Link
              key={item.id}
              href={`/content-manager/exhibition/${item.id}`}
              className="block rounded-3xl p-6 transition-colors hover:opacity-95"
              style={{ background: T.surface, border: `1px solid ${T.border}` }}
            >
              {item.thumbnailUrl ? (
                <div
                  className="mb-4 h-32 overflow-hidden rounded-2xl"
                  style={{ border: `1px solid ${T.border}` }}
                >
                  <img
                    src={item.thumbnailUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}
              <p className="text-xs" style={{ color: T.mutedLight }}>Exhibition #{item.id}</p>
              <div className="mt-3 space-y-2 text-sm" style={{ color: T.muted }}>
                <div className="flex justify-between">
                  <span>Start</span>
                  <span style={{ color: T.text }}>{item.startDate?.slice(0, 10) ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span>End</span>
                  <span style={{ color: T.text }}>{item.endDate?.slice(0, 10) ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <StatusBadge status={item.status} />
                </div>
              </div>
              <p className="mt-4 text-xs font-medium" style={{ color: T.primaryDark }}>
                View details →
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
