"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, Pencil, Search, Send, Trash2 } from "lucide-react";
import { dashboardTheme as T, cinzel, dashboardTitleClass } from "@/lib/dashboard-theme";
import { getDisplayError } from "@/lib/validation";
import { SuccessBanner, useSuccessToast } from "@/components/shared/success-banner";
import { labelStatus } from "@/lib/status-labels";
import {
  deleteExhibit,
  EXHIBIT_PAGE_SIZE,
  getExhibitPage,
  publishExhibit,
  unpublishExhibit,
  type ExhibitRow,
} from "@/services/content-manager/exhibit.service";

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  Published: { bg: "rgba(79,125,74,0.12)", color: T.success },
  Draft: { bg: "rgba(200,155,69,0.15)", color: T.primaryDark },
  Archived: { bg: "rgba(180,40,40,0.12)", color: T.danger },
};

export function ExhibitTable({
  showCreate = true,
  basePath = "/content-manager",
  canEdit = true,
  canPublish = true,
  canDelete = true,
}: {
  data?: ExhibitRow[];
  showCreate?: boolean;
  basePath?: string;
  canEdit?: boolean;
  canPublish?: boolean;
  canDelete?: boolean;
}) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<ExhibitRow[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [actingId, setActingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { success, showSuccess } = useSuccessToast();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = searchInput.trim();
      setSearch((prev) => {
        if (prev !== next) setPage(1);
        return next;
      });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getExhibitPage({ page, pageSize: EXHIBIT_PAGE_SIZE, search, status: statusFilter })
      .then((result) => {
        if (cancelled) return;
        if (result.rows.length === 0 && page > 1 && result.totalItems > 0) {
          setPage((p) => Math.max(1, p - 1));
          return;
        }
        setRows(result.rows);
        setTotalItems(result.totalItems);
        setTotalPages(result.totalPages);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setRows([]);
        setTotalItems(0);
        setTotalPages(1);
        setError(getDisplayError(err, "Không thể tải hiện vật."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, search, statusFilter, reloadKey]);

  async function handlePublish(id: number, published: boolean) {
    setActingId(id);
    setError(null);
    try {
      if (published) await unpublishExhibit(id);
      else await publishExhibit(id);
      showSuccess(published ? "Đã hủy xuất bản hiện vật." : "Đã xuất bản hiện vật.");
      setReloadKey((k) => k + 1);
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Thao tác thất bại."));
    } finally {
      setActingId(null);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Xóa hiện vật này?")) return;
    setActingId(id);
    setError(null);
    try {
      await deleteExhibit(id);
      showSuccess("Đã xóa hiện vật.");
      setReloadKey((k) => k + 1);
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Không thể xóa hiện vật."));
    } finally {
      setActingId(null);
    }
  }

  const currentPage = Math.min(page, totalPages);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className={dashboardTitleClass} style={{ fontFamily: cinzel, color: T.text }}>
          Hiện vật
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-2xl py-2.5 px-3.5 text-sm outline-none cursor-pointer"
            style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              color: T.text,
            }}
          >
            <option value="All">Tất cả trạng thái</option>
            <option value="Published">Đã xuất bản</option>
            <option value="Draft">Bản nháp</option>
            <option value="Archived">Đã xóa (Lưu trữ)</option>
          </select>
          <div className="relative w-64 min-w-[200px]">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: T.mutedLight }}
            />
            <input
              type="search"
              placeholder="Tìm hiện vật..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
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
              href={`${basePath}/artifact/create`}
              className="shrink-0 whitespace-nowrap rounded-2xl px-4 py-2.5 text-sm font-medium"
              style={{
                background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
                color: T.surface,
              }}
            >
              Tạo hiện vật
            </Link>
          )}
        </div>
      </div>

      <SuccessBanner message={success} />
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
        {loading && rows.length === 0 ? (
          <div className="px-8 py-16 text-center text-sm" style={{ color: T.muted }}>
            Đang tải hiện vật…
          </div>
        ) : rows.length === 0 ? (
          <div className="px-8 py-16 text-center text-sm" style={{ color: T.muted }}>
            Không tìm thấy hiện vật.
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
                  {["Hiện vật", "Mã", "Vị trí", "Trạng thái", "AR", "QR", "Âm thanh", "Thao tác"].map((col) => (
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
                      <td className="px-5 py-4 text-xs font-medium" style={{ color: T.text }}>
                        {(typeof row.floorNumber === "number" && !Number.isNaN(row.floorNumber)) || row.roomName || row.roomCode ? (
                          <span>
                            {typeof row.floorNumber === "number" && !Number.isNaN(row.floorNumber) ? `Tầng ${row.floorNumber}` : ""}
                            {row.roomName || row.roomCode ? `${typeof row.floorNumber === "number" && !Number.isNaN(row.floorNumber) ? " · " : ""}${row.roomCode ? `${row.roomCode} ` : ""}${row.roomName ?? ""}`.trim() : ""}
                          </span>
                        ) : (
                          <span style={{ color: T.muted }}>—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{ background: statusStyle.bg, color: statusStyle.color }}
                        >
                          {labelStatus(row.status)}
                        </span>
                      </td>
                      <td className="px-5 py-4" style={{ color: T.muted }}>
                        {row.hasAr ? "Có" : "—"}
                      </td>
                      <td className="px-5 py-4" style={{ color: T.muted }}>
                        {row.hasQr ? "Có" : "—"}
                      </td>
                      <td className="px-5 py-4" style={{ color: T.muted }}>
                        {row.hasAudio ? "Có" : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`${basePath}/artifact/${row.id}`}
                            prefetch={false}
                            className="rounded-lg p-2 transition-colors"
                            style={{ color: T.muted }}
                            aria-label="Xem"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          {canEdit && row.status !== "Archived" && (
                            <Link
                              href={`${basePath}/artifact/${row.id}/edit`}
                              prefetch={false}
                              className="rounded-lg p-2 transition-colors"
                              style={{ color: T.muted }}
                              aria-label="Sửa"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                          )}
                          {canPublish && row.status !== "Archived" && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handlePublish(row.id, row.status === "Published")}
                              className="rounded-lg p-2 transition-colors disabled:opacity-40"
                              style={{ color: T.primaryDark }}
                              aria-label="Xuất bản"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                          )}
                          {canDelete && row.status !== "Archived" && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleDelete(row.id)}
                              className="rounded-lg p-2 transition-colors disabled:opacity-40"
                              style={{ color: T.danger }}
                              aria-label="Xóa"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm" style={{ color: T.muted }}>
          <span className="font-medium" style={{ color: T.text }}>
            {totalItems}
          </span>
          {` hiện vật`}
          {totalPages > 1 ? ` · trang ${currentPage} / ${totalPages}` : ""}
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={loading || currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm disabled:opacity-40"
              style={{ border: `1px solid ${T.border}`, color: T.text, background: T.surface }}
            >
              <ChevronLeft className="h-4 w-4" />
              Trước
            </button>
            <button
              type="button"
              disabled={loading || currentPage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm disabled:opacity-40"
              style={{ border: `1px solid ${T.border}`, color: T.text, background: T.surface }}
            >
              Sau
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
