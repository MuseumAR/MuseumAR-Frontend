"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import { getDisplayError } from "@/lib/validation";
import { fetchAuditLogPage } from "@/services/admin/audit-log.service";
import type { AuditLogDto, PagedAuditLogsDto } from "@/types/api";

const PAGE_SIZE = 20;

function formatDateTime(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
}

function truncate(value: string | null | undefined, max = 48) {
  if (!value) return "—";
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

export function AuditLogPanel() {
  const [action, setAction] = useState("");
  const [userId, setUserId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  /** Only updated on Apply / Reset — drives the fetch. */
  const [queryAction, setQueryAction] = useState("");
  const [queryUserId, setQueryUserId] = useState("");
  const [queryFromDate, setQueryFromDate] = useState("");
  const [queryToDate, setQueryToDate] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PagedAuditLogsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const uid = queryUserId.trim() ? Number(queryUserId) : undefined;
        const result = await fetchAuditLogPage({
          page,
          pageSize: PAGE_SIZE,
          action: queryAction.trim() || undefined,
          userId: uid != null && Number.isFinite(uid) ? uid : undefined,
          fromDate: queryFromDate || undefined,
          toDate: queryToDate || undefined,
        });
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) {
          setError(getDisplayError(err, "Unable to load audit logs."));
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [queryAction, queryUserId, queryFromDate, queryToDate, page]);

  function handleApply(e: React.FormEvent) {
    e.preventDefault();
    setExpandedId(null);
    setQueryAction(action);
    setQueryUserId(userId);
    setQueryFromDate(fromDate);
    setQueryToDate(toDate);
    setPage(1);
  }

  function handleReset() {
    setAction("");
    setUserId("");
    setFromDate("");
    setToDate("");
    setQueryAction("");
    setQueryUserId("");
    setQueryFromDate("");
    setQueryToDate("");
    setExpandedId(null);
    setPage(1);
  }

  const items = data?.items ?? [];
  const totalItems = data?.totalItems ?? 0;
  const totalPages = Math.max(data?.totalPages ?? 1, 1);

  return (
    <div className="space-y-6 px-8 pb-10">
      <p className="text-sm" style={{ fontFamily: cinzel, color: T.muted }}>
        <span className="font-semibold" style={{ color: T.text }}>
          {totalItems}
        </span>
        {` audit log${totalItems === 1 ? "" : "s"}`}
      </p>

      <form
        onSubmit={handleApply}
        className="grid gap-3 rounded-3xl p-5 sm:grid-cols-2 lg:grid-cols-5"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        <Field label="Action">
          <input
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="e.g. Login, Update"
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
          />
        </Field>
        <Field label="User ID">
          <input
            type="number"
            min="1"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Optional"
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
          />
        </Field>
        <Field label="From">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
          />
        </Field>
        <Field label="To">
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
          />
        </Field>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:opacity-90 hover:brightness-110 hover:shadow-md active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
              color: T.surface,
            }}
          >
            <Search className="h-4 w-4" />
            Apply
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:border-[#C89B45] hover:bg-[rgba(200,155,69,0.12)] hover:opacity-90 active:scale-[0.98]"
            style={{ border: `1px solid ${T.border}`, color: T.muted, background: T.bg }}
          >
            Reset
          </button>
        </div>
      </form>

      {error && (
        <p
          className="rounded-xl px-4 py-3 text-sm"
          style={{ background: "rgba(180,40,40,0.08)", color: "#8B2E2E" }}
        >
          {error}
        </p>
      )}

      <div
        className="overflow-hidden rounded-3xl"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        {loading ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm" style={{ color: T.muted }}>
              Loading audit logs…
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm" style={{ color: T.muted }}>
              No audit logs found.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead>
                <tr
                  style={{
                    borderBottom: `1px solid ${T.border}`,
                    background: "rgba(245,230,200,0.35)",
                  }}
                >
                  {["Time", "User", "Action", "Entity", "Entity ID", "IP", ""].map((label) => (
                    <th
                      key={label || "details"}
                      className="px-5 py-4 font-medium"
                      style={{ color: T.mutedLight }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((log) => (
                  <LogRow
                    key={log.id}
                    log={log}
                    expanded={expandedId === log.id}
                    onToggle={() =>
                      setExpandedId((prev) => (prev === log.id ? null : log.id))
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm" style={{ color: T.muted }}>
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={loading || page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm disabled:opacity-40"
              style={{ border: `1px solid ${T.border}`, color: T.text, background: T.surface }}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>
            <button
              type="button"
              disabled={loading || page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm disabled:opacity-40"
              style={{ border: `1px solid ${T.border}`, color: T.text, background: T.surface }}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium" style={{ color: T.mutedLight }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function LogRow({
  log,
  expanded,
  onToggle,
}: {
  log: AuditLogDto;
  expanded: boolean;
  onToggle: () => void;
}) {
  const hasDetails = Boolean(log.oldValues || log.newValues || log.userAgent);

  return (
    <>
      <tr
        style={{ borderBottom: `1px solid ${T.border}` }}
        className="hover:bg-[rgba(200,155,69,0.05)]"
      >
        <td className="whitespace-nowrap px-5 py-4 tabular-nums" style={{ color: T.text }}>
          {formatDateTime(log.createdAt)}
        </td>
        <td className="px-5 py-4 tabular-nums" style={{ color: T.muted }}>
          {log.userId ?? "—"}
        </td>
        <td className="px-5 py-4 font-medium" style={{ color: T.text }}>
          {log.action ?? "—"}
        </td>
        <td className="px-5 py-4" style={{ color: T.muted }}>
          {log.entityType ?? "—"}
        </td>
        <td className="px-5 py-4 tabular-nums" style={{ color: T.muted }}>
          {log.entityId ?? "—"}
        </td>
        <td className="px-5 py-4 font-mono text-xs" style={{ color: T.muted }}>
          {truncate(log.ipAddress, 24)}
        </td>
        <td className="px-5 py-4">
          {hasDetails ? (
            <button
              type="button"
              onClick={onToggle}
              className="text-xs font-medium underline-offset-2 hover:underline"
              style={{ color: T.primaryDark }}
            >
              {expanded ? "Hide" : "Details"}
            </button>
          ) : (
            <span style={{ color: T.mutedLight }}>—</span>
          )}
        </td>
      </tr>
      {expanded && hasDetails && (
        <tr style={{ borderBottom: `1px solid ${T.border}`, background: "rgba(245,230,200,0.2)" }}>
          <td colSpan={7} className="px-5 py-4">
            <div className="grid gap-3 text-xs sm:grid-cols-2">
              {log.oldValues && (
                <DetailBlock label="Old values" value={log.oldValues} />
              )}
              {log.newValues && (
                <DetailBlock label="New values" value={log.newValues} />
              )}
              {log.userAgent && (
                <DetailBlock label="User agent" value={log.userAgent} />
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 font-medium" style={{ color: T.mutedLight }}>
        {label}
      </p>
      <pre
        className="max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-xl p-3"
        style={{ background: T.bg, color: T.text, border: `1px solid ${T.border}` }}
      >
        {value}
      </pre>
    </div>
  );
}
