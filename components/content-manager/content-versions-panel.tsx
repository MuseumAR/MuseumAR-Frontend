"use client";

import Link from "next/link";
import { useState } from "react";
import { Info, Plus } from "lucide-react";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import { getDisplayError } from "@/lib/validation";
import { labelStatus } from "@/lib/status-labels";
import {
  createVersionEntry,
} from "@/services/content-manager/content-version.service";
import type { ContentVersionDto } from "@/types/api";

export function ContentVersionsPanel({
  initialVersions,
}: {
  initialVersions: ContentVersionDto[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [versionNumber, setVersionNumber] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [versions, setVersions] = useState<ContentVersionDto[]>(initialVersions);
  const [lastId, setLastId] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!versionNumber.trim()) {
      setError("Vui lòng nhập số phiên bản.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await createVersionEntry(
        versionNumber.trim(),
        description.trim(),
      );
      const row: ContentVersionDto = {
        id: result.id,
        versionNumber: result.versionNumber,
        changeDescription: result.changeDescription || null,
        status: "Draft",
        createdAt: new Date().toISOString(),
        museumId: 0,
      };
      setVersions((prev) => [row, ...prev]);
      setLastId(result.id);
      setVersionNumber("");
      setDescription("");
      setShowForm(false);
    } catch (err) {
      setError(getDisplayError(err, "Không thể tạo phiên bản nội dung."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 px-8 pb-10">
      <div
        className="flex gap-3 rounded-2xl p-4"
        style={{ background: "rgba(200,155,69,0.08)", border: `1px solid ${T.border}` }}
      >
        <Info className="mt-0.5 h-5 w-5 shrink-0" style={{ color: T.primaryDark }} />
        <div className="space-y-1 text-sm" style={{ color: T.muted }}>
          <p style={{ color: T.text }}>
            <strong>Phiên bản nội dung</strong> đánh dấu một bản chụp nội dung bảo tàng
            (hiện vật, media, tài sản AR, v.v.).
          </p>
          <p>
            Tạo một phiên bản, ghi lại <strong>mã ID</strong> được trả về, rồi mở{" "}
            <Link
              href="/content-manager/offline-packages"
              className="font-medium underline-offset-2 hover:underline"
              style={{ color: T.primaryDark }}
            >
              Gói ngoại tuyến
            </Link>{" "}
            và nhập mã đó để tạo gói tải về.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm" style={{ fontFamily: cinzel, color: T.muted }}>
          <span className="font-semibold" style={{ color: T.text }}>
            {versions.length}
          </span>
          {` phiên bản`}
        </p>
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
          {showForm ? "Đóng" : "Tạo phiên bản"}
        </button>
      </div>

      {lastId != null && (
        <p
          className="rounded-2xl px-4 py-3 text-sm"
          style={{ background: "rgba(79,125,74,0.10)", color: T.success }}
        >
          Đã tạo phiên bản. Dùng mã <strong style={{ color: T.text }}>{lastId}</strong> trong
          Gói ngoại tuyến.
        </p>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl p-6"
          style={{ background: T.surface, border: `1px solid ${T.border}` }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-sm" style={{ color: T.muted }}>
                Số phiên bản *
              </label>
              <input
                value={versionNumber}
                onChange={(e) => setVersionNumber(e.target.value)}
                placeholder="1.0.0"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-sm" style={{ color: T.muted }}>
                Mô tả thay đổi
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="VD: Phát hành đầu tiên với hiện vật Đông Sơn"
                className="w-full resize-none rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
              />
            </div>
          </div>
          {error && (
            <p className="mt-4 text-sm" style={{ color: "#8B2E2E" }}>
              {error}
            </p>
          )}
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-50"
              style={{ background: T.primary, color: T.surface }}
            >
              {isSubmitting ? "Đang tạo…" : "Lưu"}
            </button>
          </div>
        </form>
      )}

      <div
        className="overflow-hidden rounded-3xl"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        {versions.length === 0 ? (
          <p className="px-8 py-16 text-center text-sm" style={{ color: T.muted }}>
            Chưa có phiên bản nội dung. Tạo một phiên bản để bắt đầu.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr
                style={{
                  borderBottom: `1px solid ${T.border}`,
                  background: "rgba(245,230,200,0.35)",
                }}
              >
                {["Mã", "Phiên bản", "Trạng thái", "Mô tả", "Ngày tạo"].map((h) => (
                  <th key={h} className="px-5 py-4 font-medium" style={{ color: T.mutedLight }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {versions.map((item) => (
                <tr key={item.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td className="px-5 py-4 font-medium tabular-nums" style={{ color: T.text }}>
                    {item.id}
                  </td>
                  <td className="px-5 py-4" style={{ color: T.text }}>
                    {item.versionNumber}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{
                        background: "rgba(200,155,69,0.15)",
                        color: T.primaryDark,
                      }}
                    >
                      {labelStatus(item.status)}
                    </span>
                  </td>
                  <td
                    className="max-w-xs truncate px-5 py-4"
                    style={{ color: T.muted }}
                    title={item.changeDescription ?? undefined}
                  >
                    {item.changeDescription?.trim() || "—"}
                  </td>
                  <td className="px-5 py-4" style={{ color: T.muted }}>
                    {item.createdAt?.slice(0, 10) ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
