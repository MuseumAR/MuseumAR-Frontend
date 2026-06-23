"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Eye, Pencil, Search, Send, Trash2 } from "lucide-react";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import { getDisplayError } from "@/lib/validation";
import {
  deleteExhibit,
  publishExhibit,
  unpublishExhibit,
  type ExhibitRow,
} from "@/services/content-manager/exhibit.service";

const PAGE_SIZE = 8;

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  Published: { bg: "rgba(79,125,74,0.12)", color: T.success },
  Draft: { bg: "rgba(200,155,69,0.15)", color: T.primaryDark },
};

export function ExhibitTable({
  data,
  showCreate = true,
}: {
  data: ExhibitRow[];
  showCreate?: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [actingId, setActingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (row) =>
        row.title.toLowerCase().includes(q) ||
        row.exhibitCode.toLowerCase().includes(q) ||
        row.status.toLowerCase().includes(q),
    );
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  async function handlePublish(id: number, published: boolean) {
    setActingId(id);
    setError(null);
    try {
      if (published) await unpublishExhibit(id);
      else await publishExhibit(id);
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Action failed."));
    } finally {
      setActingId(null);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this exhibit?")) return;
    setActingId(id);
    setError(null);
    try {
      await deleteExhibit(id);
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Unable to delete exhibit."));
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-lg font-semibold" style={{ fontFamily: cinzel, color: T.text }}>
          Exhibits
        </h3>
        <div className="flex items-center gap-3">
          <div className="relative w-64 min-w-[200px]">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: T.mutedLight }}
            />
            <input
              type="search"
              placeholder="Search exhibits..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-2xl py-2.5 pl-11 pr-4 text-sm outline-none"
              style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                color: T.text,
              }}
            />
          </div>
          {showCreate && (
            <Link
              href="/content-manager/artifact/create"
              className="shrink-0 whitespace-nowrap rounded-2xl px-4 py-2.5 text-sm font-medium"
              style={{
                background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
                color: T.surface,
              }}
            >
              Create exhibit
            </Link>
          )}
        </div>
      </div>

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
        style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          boxShadow: "0 6px 20px rgba(43,29,14,0.05)",
        }}
      >
        {rows.length === 0 ? (
          <div className="px-8 py-16 text-center text-sm" style={{ color: T.muted }}>
            No exhibits found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr
                  style={{
                    borderBottom: `1px solid ${T.border}`,
                    background: "rgba(245,230,200,0.35)",
                  }}
                >
                  {["Exhibit", "Code", "Status", "AR", "QR", "Audio", "Actions"].map((col) => (
                    <th
                      key={col}
                      className="px-5 py-4 text-xs font-medium uppercase tracking-wider"
                      style={{ color: T.mutedLight }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const statusStyle = STATUS_STYLES[row.status] ?? {
                    bg: "rgba(109,90,69,0.12)",
                    color: T.muted,
                  };
                  const busy = actingId === row.id;
                  return (
                    <tr
                      key={row.id}
                      className="transition-colors hover:bg-[rgba(200,155,69,0.05)]"
                      style={{ borderBottom: `1px solid ${T.border}` }}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl"
                            style={{
                              background: "rgba(200,155,69,0.10)",
                              border: `1px solid ${T.border}`,
                            }}
                          >
                            {row.thumbnailUrl ? (
                              <img src={row.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-xs font-semibold" style={{ color: T.primaryDark }}>
                                {row.id}
                              </span>
                            )}
                          </div>
                          <p className="font-medium" style={{ color: T.text }}>
                            {row.title}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs" style={{ color: T.muted }}>
                        {row.exhibitCode}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{ background: statusStyle.bg, color: statusStyle.color }}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-5 py-4" style={{ color: T.muted }}>
                        {row.hasAr ? "Yes" : "—"}
                      </td>
                      <td className="px-5 py-4" style={{ color: T.muted }}>
                        {row.hasQr ? "Yes" : "—"}
                      </td>
                      <td className="px-5 py-4" style={{ color: T.muted }}>
                        {row.hasAudio ? "Yes" : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/content-manager/artifact/${row.id}`}
                            className="rounded-lg p-2 transition-colors"
                            style={{ color: T.muted }}
                            aria-label="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/content-manager/artifact/${row.id}/edit`}
                            className="rounded-lg p-2 transition-colors"
                            style={{ color: T.muted }}
                            aria-label="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handlePublish(row.id, row.status === "Published")}
                            className="rounded-lg p-2 transition-colors disabled:opacity-40"
                            style={{ color: T.primaryDark }}
                            aria-label="Publish"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleDelete(row.id)}
                            className="rounded-lg p-2 transition-colors disabled:opacity-40"
                            style={{ color: T.danger }}
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm"
              style={{
                background: p === currentPage ? T.primary : T.surface,
                color: p === currentPage ? T.surface : T.muted,
                border: `1px solid ${p === currentPage ? T.primary : T.border}`,
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
