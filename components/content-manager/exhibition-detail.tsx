"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import { getDisplayError } from "@/lib/validation";
import { labelStatus } from "@/lib/status-labels";
import {
  deleteExhibition,
  updateExhibition,
  uploadExhibitionImage,
} from "@/services/content-manager/exhibition.service";
import {
  getExhibits,
  getExhibitsByExhibition,
  assignExhibitsToExhibition,
  removeExhibitFromExhibition,
} from "@/services/content-manager/content-api.service";
import type { ExhibitionDto, ExhibitDto } from "@/types/api";

function StatusBadge({ status }: { status: string }) {
  const active = status === "Active";
  const inactive = status === "Inactive";
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{
        background: active
          ? "rgba(79,125,74,0.12)"
          : inactive
            ? "rgba(200,155,69,0.15)"
            : "rgba(109,90,69,0.12)",
        color: active ? T.success : inactive ? T.primaryDark : T.muted,
      }}
    >
      {labelStatus(status)}
    </span>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return value.slice(0, 10);
}

export function ExhibitionDetail({ exhibition }: { exhibition: ExhibitionDto }) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [name, setName] = useState(exhibition.name ?? "");
  const [description, setDescription] = useState(exhibition.description ?? "");
  const [startDate, setStartDate] = useState(exhibition.startDate?.slice(0, 10) ?? "");
  const [endDate, setEndDate] = useState(exhibition.endDate?.slice(0, 10) ?? "");
  const [status, setStatus] = useState(exhibition.status);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Exhibits Management State
  const [exhibitsInExhibition, setExhibitsInExhibition] = useState<ExhibitDto[]>([]);
  const [allMuseumExhibits, setAllMuseumExhibits] = useState<ExhibitDto[]>([]);
  const [loadingExhibits, setLoadingExhibits] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedExhibitId, setSelectedExhibitId] = useState<number | "">("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const loadExhibitsData = async () => {
    setLoadingExhibits(true);
    try {
      const [linked, all] = await Promise.all([
        getExhibitsByExhibition(exhibition.id).catch(() => []),
        getExhibits().catch(() => []),
      ]);
      setExhibitsInExhibition(linked);
      setAllMuseumExhibits(all);
    } catch (err) {
      console.error("Failed to load exhibits data", err);
    } finally {
      setLoadingExhibits(false);
    }
  };

  useEffect(() => {
    loadExhibitsData();
  }, [exhibition.id]);

  const handleAssignExhibit = async () => {
    if (!selectedExhibitId) return;
    setIsAssigning(true);
    setAssignError(null);
    try {
      await assignExhibitsToExhibition(exhibition.id, [Number(selectedExhibitId)]);
      setSelectedExhibitId("");
      setShowAddModal(false);
      await loadExhibitsData();
    } catch (err) {
      setAssignError(getDisplayError(err, "Không thể gán hiện vật vào triển lãm."));
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveExhibit = async (exhibitId: number) => {
    if (!confirm("Bạn có chắc chắn muốn gỡ hiện vật này khỏi triển lãm?")) return;
    try {
      await removeExhibitFromExhibition(exhibition.id, exhibitId);
      await loadExhibitsData();
    } catch (err) {
      alert(getDisplayError(err, "Không thể gỡ hiện vật."));
    }
  };

  async function handleDelete() {
    if (!confirm("Bạn có chắc chắn muốn xóa triển lãm này?")) return;
    try {
      await deleteExhibition(exhibition.id);
      router.push("/content-manager/exhibition");
      router.refresh();
    } catch (err) {
      alert(getDisplayError(err, "Không thể xóa triển lãm."));
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!name.trim()) {
      setError("Vui lòng nhập tên triển lãm.");
      setIsSubmitting(false);
      return;
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setError("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.");
      setIsSubmitting(false);
      return;
    }

    try {
      await updateExhibition(exhibition.id, {
        museumId: exhibition.museumId,
        themeId: exhibition.themeId ?? undefined,
        name: name.trim(),
        description: description.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status,
      });

      if (thumbnailFile) {
        await uploadExhibitionImage(exhibition.id, thumbnailFile);
      }

      setShowEdit(false);
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Không thể cập nhật triển lãm."));
    } finally {
      setIsSubmitting(false);
    }
  }

  // Filter unassigned exhibits for selection dropdown
  const unassignedExhibits = allMuseumExhibits.filter(
    (e) => !exhibitsInExhibition.some((linked) => linked.id === e.id)
  );

  return (
    <div className="px-8 pb-10">
      <Link
        href="/content-manager/exhibition"
        className="mb-6 inline-flex items-center gap-2 text-sm"
        style={{ color: T.muted }}
      >
        ← Quay lại danh sách
      </Link>

      <div className="space-y-6">
        {/* Exhibition Metadata Header Card */}
        <div
          className="rounded-3xl p-6"
          style={{ background: T.surface, border: `1px solid ${T.border}` }}
        >
          {showEdit ? (
            <form onSubmit={handleUpdate} className="space-y-4">
              <h3 className="text-lg font-semibold" style={{ fontFamily: cinzel, color: T.text }}>
                Chỉnh sửa triển lãm
              </h3>
              {error && <p className="text-sm" style={{ color: "#8B2E2E" }}>{error}</p>}
              
              <div className="space-y-1.5">
                <label className="block text-sm" style={{ color: T.muted }}>Tên triển lãm</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                  style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm" style={{ color: T.muted }}>Mô tả</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none"
                  style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-sm" style={{ color: T.muted }}>Ngày bắt đầu</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm outline-none" style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm" style={{ color: T.muted }}>Ngày kết thúc</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm outline-none" style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm" style={{ color: T.muted }}>Trạng thái</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm outline-none" style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}>
                    <option value="Active">{labelStatus("Active")}</option>
                    <option value="Inactive">{labelStatus("Inactive")}</option>
                    <option value="Ended">{labelStatus("Ended")}</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm" style={{ color: T.muted }}>Ảnh thu nhỏ mới</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none file:mr-4 file:rounded-lg file:border-0 file:bg-[rgba(200,155,69,0.15)] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-[#A67C1E]"
                    style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowEdit(false)} className="rounded-xl px-5 py-2 text-sm font-medium" style={{ border: `1px solid ${T.border}`, color: T.text }}>
                  Hủy
                </button>
                <button type="submit" disabled={isSubmitting} className="rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-50" style={{ background: T.primary, color: T.surface }}>
                  {isSubmitting ? "Đang lưu…" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-8 md:flex-row">
              <div
                className="h-56 w-full shrink-0 overflow-hidden rounded-2xl md:h-64 md:w-72"
                style={{ border: `1px solid ${T.border}`, background: "rgba(200,155,69,0.08)" }}
              >
                {exhibition.thumbnailUrl ? (
                  <img
                    src={exhibition.thumbnailUrl}
                    alt={exhibition.name || `Triển lãm #${exhibition.id}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center text-sm"
                    style={{ color: T.mutedLight }}
                  >
                    Chưa có ảnh
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2
                      className="text-2xl font-bold"
                      style={{ fontFamily: cinzel, color: T.primaryDark }}
                    >
                      {exhibition.name || `Triển lãm #${exhibition.id}`}
                    </h2>
                    <p className="text-xs mt-1" style={{ color: T.mutedLight }}>Mã triển lãm: {exhibition.id}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={exhibition.status} />
                    <button
                      type="button"
                      onClick={() => setShowEdit(true)}
                      className="rounded-xl px-4 py-1.5 text-xs font-medium"
                      style={{ border: `1px solid ${T.border}`, color: T.text, background: T.surface }}
                    >
                      Chỉnh sửa
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="rounded-xl px-4 py-1.5 text-xs font-medium"
                      style={{ border: `1px solid ${T.danger}`, color: T.danger, background: "rgba(180,40,40,0.05)" }}
                    >
                      Xóa
                    </button>
                  </div>
                </div>

                {exhibition.description && (
                  <p className="text-sm mt-1" style={{ color: T.text }}>
                    {exhibition.description}
                  </p>
                )}

                <dl className="grid gap-3 text-sm sm:grid-cols-2 mt-4 pt-4 border-t" style={{ borderColor: T.border }}>
                  <InfoRow label="Mã bảo tàng" value={String(exhibition.museumId)} />
                  <InfoRow label="Trạng thái" value={labelStatus(exhibition.status)} />
                  <InfoRow label="Ngày bắt đầu" value={formatDate(exhibition.startDate)} />
                  <InfoRow label="Ngày kết thúc" value={formatDate(exhibition.endDate)} />
                </dl>
              </div>
            </div>
          )}
        </div>

        {/* Assigned Exhibits Management Card */}
        <div
          className="rounded-3xl p-6 shadow-sm"
          style={{ background: T.surface, border: `1px solid ${T.border}` }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold" style={{ fontFamily: cinzel, color: T.primaryDark }}>
                Danh sách Hiện vật trong Triển lãm ({exhibitsInExhibition.length})
              </h3>
              <p className="text-xs" style={{ color: T.mutedLight }}>
                Quản lý các hiện vật được trưng bày trong đợt triển lãm này
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setAssignError(null);
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold shadow-sm transition-opacity hover:opacity-90"
              style={{ background: T.primary, color: T.surface }}
            >
              + Gán thêm hiện vật vào Triển lãm
            </button>
          </div>

          {loadingExhibits ? (
            <div className="py-8 text-center text-xs font-medium" style={{ color: T.muted }}>
              Đang tải danh sách hiện vật...
            </div>
          ) : exhibitsInExhibition.length === 0 ? (
            <div
              className="rounded-2xl py-8 text-center text-xs font-medium"
              style={{ background: T.bg, color: T.muted }}
            >
              Chưa có hiện vật nào được gán vào triển lãm này. Bấm nút phía trên để bắt đầu gán hiện vật!
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {exhibitsInExhibition.map((ex) => {
                const title = ex.translations?.[0]?.title || `Hiện vật #${ex.id}`;
                const code = ex.exhibitCode || `EX-${ex.id}`;
                return (
                  <div
                    key={ex.id}
                    className="flex items-center gap-3.5 rounded-2xl p-3.5 border transition-colors"
                    style={{ background: T.bg, borderColor: T.border }}
                  >
                    {ex.thumbnailUrl ? (
                      <img
                        src={ex.thumbnailUrl}
                        alt={title}
                        className="h-14 w-14 rounded-xl object-cover shrink-0"
                        style={{ border: `1px solid ${T.border}` }}
                      />
                    ) : (
                      <div
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl font-bold text-xs"
                        style={{ background: T.surface, color: T.mutedLight, border: `1px solid ${T.border}` }}
                      >
                        {code}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold truncate" style={{ color: T.text }}>
                        {title}
                      </h4>
                      <p className="text-[11px] font-mono mt-0.5" style={{ color: T.mutedLight }}>
                        Mã: {code}
                      </p>
                      {ex.roomName && (
                        <p className="text-[10px] mt-0.5" style={{ color: T.success }}>
                          📍 {ex.roomName}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveExhibit(ex.id)}
                      className="rounded-lg p-1.5 text-xs font-medium transition-colors hover:bg-red-50"
                      style={{ color: T.danger }}
                      title="Gỡ khỏi triển lãm"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal / Dialog Gán Hiện vật */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-3xl p-6 shadow-xl"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}
          >
            <h3 className="text-base font-bold mb-2" style={{ color: T.primaryDark }}>
              Gán Hiện vật vào Triển lãm
            </h3>
            <p className="text-xs mb-4" style={{ color: T.mutedLight }}>
              Chọn một hiện vật trong kho bảo tàng để gán vào triển lãm &ldquo;{exhibition.name || `#${exhibition.id}`}&rdquo;
            </p>

            {assignError && (
              <p className="mb-3 rounded-xl p-2.5 text-xs" style={{ background: "rgba(180,40,40,0.08)", color: "#8B2E2E" }}>
                {assignError}
              </p>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: T.text }}>
                  Chọn Hiện vật:
                </label>
                {unassignedExhibits.length === 0 ? (
                  <p className="text-xs italic py-2" style={{ color: T.muted }}>
                    Tất cả hiện vật trong bảo tàng đã được gán vào triển lãm này.
                  </p>
                ) : (
                  <select
                    value={selectedExhibitId}
                    onChange={(e) => setSelectedExhibitId(Number(e.target.value))}
                    className="w-full rounded-xl px-3.5 py-2.5 text-xs outline-none"
                    style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                  >
                    <option value="">-- Chọn hiện vật --</option>
                    {unassignedExhibits.map((ex) => {
                      const title = ex.translations?.[0]?.title || `Hiện vật #${ex.id}`;
                      const code = ex.exhibitCode || `EX-${ex.id}`;
                      return (
                        <option key={ex.id} value={ex.id}>
                          [{code}] {title}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold"
                  style={{ border: `1px solid ${T.border}`, color: T.text }}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={!selectedExhibitId || isAssigning}
                  onClick={handleAssignExhibit}
                  className="rounded-xl px-4 py-2 text-xs font-semibold disabled:opacity-50"
                  style={{ background: T.primary, color: T.surface }}
                >
                  {isAssigning ? "Đang gán…" : "Xác nhận gán"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt style={{ color: T.mutedLight }}>{label}:</dt>
      <dd style={{ color: T.text }}>{value}</dd>
    </div>
  );
}
