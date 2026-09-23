"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { dashboardTheme as T, cinzel, dashboardTitleClass } from "@/lib/dashboard-theme";
import { getDisplayError } from "@/lib/validation";
import { SuccessBanner, useSuccessToast } from "@/components/shared/success-banner";
import { labelStatus } from "@/lib/status-labels";
import {
  deleteExhibition,
  updateExhibition,
  uploadExhibitionImage,
} from "@/services/content-manager/exhibition.service";
import {
  getExhibitsByExhibition,
  getAllExhibitListItems,
  exhibitListItemToStub,
  assignExhibitsToExhibition,
  removeExhibitFromExhibition,
} from "@/services/content-manager/content-api.service";
import { themeDisplayName, themeMatchesName } from "@/services/content-manager/taxonomy.service";
import type { ExhibitionDto, ExhibitDto, ThemeDto } from "@/types/api";

function StatusBadge({ status }: { status: string }) {
  const active = status === "Active";
  const inactive = status === "Inactive";
  const ended = status === "Ended";
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{
        background: active
          ? "rgba(79,125,74,0.12)"
          : inactive
            ? "rgba(200,155,69,0.15)"
            : "rgba(180,50,50,0.12)",
        color: active ? T.success : inactive ? T.primaryDark : "#9E2A2B",
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

export function ExhibitionDetail({
  exhibition,
  themes = [],
}: {
  exhibition: ExhibitionDto;
  themes?: ThemeDto[];
}) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [name, setName] = useState(exhibition.name ?? "");
  const [description, setDescription] = useState(exhibition.description ?? "");
  const [startDate, setStartDate] = useState(exhibition.startDate?.slice(0, 10) ?? "");
  const [endDate, setEndDate] = useState(exhibition.endDate?.slice(0, 10) ?? "");
  const [status, setStatus] = useState(exhibition.status);
  const [themeId, setThemeId] = useState<number | "">(() => {
    if (exhibition.themeId) return exhibition.themeId;
    if (exhibition.themeName) {
      const matched = themes.find((t) => themeMatchesName(t, exhibition.themeName!));
      if (matched) return matched.id;
    }
    return "";
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Exhibits Management State
  const [exhibitsInExhibition, setExhibitsInExhibition] = useState<ExhibitDto[]>([]);
  const [allMuseumExhibits, setAllMuseumExhibits] = useState<ExhibitDto[]>([]);
  const [loadingExhibits, setLoadingExhibits] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedExhibitIds, setSelectedExhibitIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const { success, showSuccess } = useSuccessToast();

  const loadExhibitsData = async () => {
    setLoadingExhibits(true);
    try {
      const [linked, all] = await Promise.all([
        getExhibitsByExhibition(exhibition.id).catch(() => []),
        getAllExhibitListItems().then((items) => items.map(exhibitListItemToStub)).catch(() => []),
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
    let cancelled = false;
    Promise.all([
      getExhibitsByExhibition(exhibition.id).catch(() => [] as ExhibitDto[]),
      getAllExhibitListItems()
        .then((items) => items.map(exhibitListItemToStub))
        .catch(() => [] as ExhibitDto[]),
    ]).then(([linked, all]) => {
      if (cancelled) return;
      setExhibitsInExhibition(linked);
      setAllMuseumExhibits(all);
      setLoadingExhibits(false);
    });
    return () => {
      cancelled = true;
    };
  }, [exhibition.id]);

  const handleAssignExhibit = async () => {
    if (selectedExhibitIds.length === 0) return;
    setIsAssigning(true);
    setAssignError(null);
    try {
      await assignExhibitsToExhibition(exhibition.id, selectedExhibitIds);
      setSelectedExhibitIds([]);
      setSearchQuery("");
      setShowAddModal(false);
      showSuccess("Đã gán hiện vật vào triển lãm.");
      await loadExhibitsData();
    } catch (err) {
      setAssignError(getDisplayError(err, "Không thể gán hiện vật vào triển lãm."));
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveExhibit = async (exhibitId: number) => {
    if (!confirm("Gỡ hiện vật này khỏi triển lãm?")) return;
    try {
      await removeExhibitFromExhibition(exhibition.id, exhibitId);
      showSuccess("Đã gỡ hiện vật khỏi triển lãm.");
      await loadExhibitsData();
    } catch (err) {
      alert(getDisplayError(err, "Không thể gỡ hiện vật."));
    }
  };

  async function handleDelete() {
    if (!confirm("Xóa triển lãm này?")) return;
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const initialStart = exhibition.startDate ? exhibition.startDate.slice(0, 10) : "";
    if (startDate && startDate !== initialStart) {
      const s = new Date(startDate);
      s.setHours(0, 0, 0, 0);
      if (s < today) {
        setError("Ngày bắt đầu không được ở trong quá khứ.");
        setIsSubmitting(false);
        return;
      }
    }

    if (endDate) {
      const eDate = new Date(endDate);
      eDate.setHours(0, 0, 0, 0);
      if (eDate < today) {
        setError("Ngày kết thúc không được ở trong quá khứ.");
        setIsSubmitting(false);
        return;
      }
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setError("Ngày kết thúc phải diễn ra sau hoặc cùng ngày với ngày bắt đầu.");
      setIsSubmitting(false);
      return;
    }

    try {
      await updateExhibition(exhibition.id, {
        museumId: exhibition.museumId,
        themeId: themeId ? Number(themeId) : undefined,
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
      showSuccess("Đã cập nhật triển lãm.");
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Không thể cập nhật triển lãm."));
    } finally {
      setIsSubmitting(false);
    }
  }

  // Filter unassigned exhibits for selection dropdown (only published artifacts)
  const unassignedExhibits = allMuseumExhibits.filter(
    (e) => e.status?.toLowerCase() === "published" && !exhibitsInExhibition.some((linked) => linked.id === e.id)
  );

  const filteredExhibits = unassignedExhibits.filter((ex) => {
    const title = (ex.translations?.[0]?.title || "").toLowerCase();
    const code = (ex.exhibitCode || "").toLowerCase();
    const q = searchQuery.toLowerCase();
    return title.includes(q) || code.includes(q);
  });

  const todayStr = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  return (
    <div className="px-8 pb-10">
      <Link
        href="/content-manager/exhibition"
        prefetch={false}
        className="mb-6 inline-flex items-center gap-2 text-sm"
        style={{ color: T.muted }}
      >
        ← Quay lại danh sách
      </Link>

      <div className="space-y-6">
        <SuccessBanner message={success} />
        {/* Exhibition Metadata Header Card */}
        <div
          className="rounded-3xl p-6"
          style={{ background: T.surface, border: `1px solid ${T.border}` }}
        >
          {showEdit ? (
            <form onSubmit={handleUpdate} className="space-y-4">
              <h3 className={dashboardTitleClass} style={{ fontFamily: cinzel, color: T.text }}>
                Sửa triển lãm
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
                  <input
                    type="date"
                    min={exhibition.startDate && exhibition.startDate.slice(0, 10) < todayStr ? exhibition.startDate.slice(0, 10) : todayStr}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                    style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm" style={{ color: T.muted }}>Ngày kết thúc</label>
                  <input
                    type="date"
                    min={startDate || todayStr}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                    style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                  />
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
                  <label className="block text-sm" style={{ color: T.muted }}>Thumbnail mới</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none file:mr-4 file:rounded-lg file:border-0 file:bg-[rgba(200,155,69,0.15)] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-[#A67C1E]"
                    style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm" style={{ color: T.muted }}>Chủ đề</label>
                  <select
                    value={themeId}
                    onChange={(e) => setThemeId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                    style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                  >
                    <option value="">Không chọn</option>
                    {themes.map((theme) => (
                      <option key={theme.id} value={theme.id}>
                        {themeDisplayName(theme)}
                      </option>
                    ))}
                  </select>
                  {themes.length === 0 && (
                    <p className="text-[11px]" style={{ color: T.mutedLight }}>
                      Chưa có chủ đề. Tạo ở Admin → Phân loại → Chủ đề trước.
                    </p>
                  )}
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
                      className={dashboardTitleClass}
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
                      Sửa
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
                  <InfoRow label="Chủ đề" value={exhibition.themeName || "—"} />
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
              <h3 className={dashboardTitleClass} style={{ fontFamily: cinzel, color: T.primaryDark }}>
                Hiện vật trong triển lãm ({exhibitsInExhibition.length})
              </h3>
              <p className="text-xs" style={{ color: T.mutedLight }}>
                Gán hiện vật vào sự kiện này. Tầng / Phòng (bản đồ và vị trí AR) không đổi ở đây.
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
              + Gán hiện vật vào triển lãm
            </button>
          </div>

          {loadingExhibits ? (
            <div className="py-8 text-center text-xs font-medium" style={{ color: T.muted }}>
              Đang tải hiện vật...
            </div>
          ) : exhibitsInExhibition.length === 0 ? (
            <div
              className="rounded-2xl py-8 text-center text-xs font-medium"
              style={{ background: T.bg, color: T.muted }}
            >
              Chưa gán hiện vật nào. Dùng nút phía trên để gán.
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
            <h3 className={`${dashboardTitleClass} mb-2`} style={{ color: T.primaryDark }}>
              Gán hiện vật vào triển lãm
            </h3>
            <p className="text-xs mb-3" style={{ color: T.mutedLight }}>
              Chọn hiện vật của bảo tàng để gán vào &ldquo;{exhibition.name || `#${exhibition.id}`}&rdquo;
            </p>
            <p
              className="mb-4 rounded-xl px-3 py-2.5 text-xs leading-relaxed"
              style={{ background: "rgba(200,155,69,0.12)", color: T.primaryDark }}
            >
              Chỉ gắn hiện vật vào triển lãm, không đổi vị trí trên bản đồ.
              Nếu hiện vật đã chuyển chỗ, cập nhật Tầng / Phòng ở trang sửa hiện vật để bản đồ và AR đúng.
            </p>

            {assignError && (
              <p className="mb-3 rounded-xl p-2.5 text-xs" style={{ background: "rgba(180,40,40,0.08)", color: "#8B2E2E" }}>
                {assignError}
              </p>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: T.text }}>
                  Chọn hiện vật:
                </label>
                {unassignedExhibits.length === 0 ? (
                  <p className="text-xs italic py-2" style={{ color: T.muted }}>
                    Tất cả hiện vật đã được gán vào triển lãm này.
                  </p>
                ) : (
                  <>
                    {/* Search Input */}
                    <div className="mb-3">
                      <input
                        type="text"
                        placeholder="Tìm theo mã hoặc tên..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-xl px-3 py-2 text-xs outline-none"
                        style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                      />
                    </div>

                    {/* Selection Helpers */}
                    <div className="flex items-center justify-between text-[11px] mb-2 px-1">
                      <span style={{ color: T.muted }}>
                        Đã chọn: <strong>{selectedExhibitIds.length}</strong> / {unassignedExhibits.length}
                      </span>
                      <div className="flex gap-2 font-semibold">
                        <button
                          type="button"
                          onClick={() => {
                            const visibleIds = filteredExhibits.map((e) => e.id);
                            setSelectedExhibitIds((prev) => {
                              const union = new Set([...prev, ...visibleIds]);
                              return Array.from(union);
                            });
                          }}
                          className="hover:underline"
                          style={{ color: T.primaryDark }}
                        >
                          Chọn đang hiện
                        </button>
                        <span style={{ color: T.border }}>|</span>
                        <button
                          type="button"
                          onClick={() => setSelectedExhibitIds([])}
                          className="hover:underline"
                          style={{ color: T.danger }}
                        >
                          Bỏ chọn tất cả
                        </button>
                      </div>
                    </div>

                    {/* Checklist Container */}
                    <div
                      className="max-h-60 overflow-y-auto rounded-xl p-1.5 space-y-1 mb-2 border"
                      style={{ borderColor: T.border, background: T.bg }}
                    >
                      {filteredExhibits.length === 0 ? (
                        <p className="text-xs italic py-4 text-center" style={{ color: T.muted }}>
                          Không tìm thấy hiện vật khớp.
                        </p>
                      ) : (
                        filteredExhibits.map((ex) => {
                          const isChecked = selectedExhibitIds.includes(ex.id);
                          const title = ex.translations?.[0]?.title || `Hiện vật #${ex.id}`;
                          const code = ex.exhibitCode || `EX-${ex.id}`;
                          return (
                            <label
                              key={ex.id}
                              className="flex items-center gap-3 rounded-lg p-2 transition-colors cursor-pointer select-none hover:bg-black/5"
                              style={{
                                background: isChecked ? "rgba(200,155,69,0.08)" : "transparent",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedExhibitIds(selectedExhibitIds.filter((id) => id !== ex.id));
                                  } else {
                                    setSelectedExhibitIds([...selectedExhibitIds, ex.id]);
                                  }
                                }}
                                className="rounded border-gray-300 focus:ring-[#A67C1E] h-3.5 w-3.5"
                                style={{ accentColor: "#A67C1E" }}
                              />
                              {ex.thumbnailUrl ? (
                                <img
                                  src={ex.thumbnailUrl}
                                  alt={title}
                                  className="h-8 w-8 rounded object-cover shrink-0"
                                  style={{ border: `1px solid ${T.border}` }}
                                />
                              ) : (
                                <div
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded font-bold text-[10px]"
                                  style={{ background: T.surface, color: T.mutedLight, border: `1px solid ${T.border}` }}
                                >
                                  EX
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold truncate" style={{ color: T.text }}>
                                  {title}
                                </p>
                                <p className="text-[10px] font-mono" style={{ color: T.mutedLight }}>
                                  {code}
                                </p>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </>
                )}
                <p className="mt-2 text-xs" style={{ color: T.muted }}>
                  Cần sửa Tầng / Phòng? Làm trên trang sửa hiện vật trong danh sách Hiện vật.
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedExhibitIds([]);
                    setSearchQuery("");
                  }}
                  className="rounded-xl px-4 py-2 text-xs font-semibold"
                  style={{ border: `1px solid ${T.border}`, color: T.text }}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={selectedExhibitIds.length === 0 || isAssigning}
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
