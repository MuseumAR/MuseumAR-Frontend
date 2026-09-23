"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { dashboardTheme as T, cinzel, dashboardTitleClass } from "@/lib/dashboard-theme";
import { getDisplayError } from "@/lib/validation";
import { labelStatus } from "@/lib/status-labels";
import { createExhibitionEntry, uploadExhibitionImage } from "@/services/content-manager/exhibition.service";
import { themeDisplayName } from "@/services/content-manager";
import type { ExhibitionDto, ThemeDto } from "@/types/api";

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

export function ExhibitionPanel({
  exhibitions,
  museumId,
  themes,
}: {
  exhibitions: ExhibitionDto[];
  museumId: number;
  themes: ThemeDto[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [themeId, setThemeId] = useState<number | "">("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
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

    if (startDate) {
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
      const exhibition = await createExhibitionEntry({
        museumId,
        themeId: themeId ? Number(themeId) : undefined,
        name: name.trim(),
        description: description.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status: "Inactive",
      });

      if (thumbnailFile) {
        await uploadExhibitionImage(exhibition.id, thumbnailFile);
      }

      setShowForm(false);
      setName("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      setThemeId("");
      setThumbnailFile(null);
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Không thể tạo triển lãm."));
    } finally {
      setIsSubmitting(false);
    }
  }

  const todayStr = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  return (
    <div className="space-y-6 px-8 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm" style={{ fontFamily: cinzel, color: T.muted }}>
          <span className="font-semibold" style={{ color: T.text }}>
            {exhibitions.length}
          </span>
          {` triển lãm`}
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
          {showForm ? "Đóng" : "Tạo triển lãm"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl p-6 space-y-4"
          style={{ background: T.surface, border: `1px solid ${T.border}` }}
        >
          <div className="space-y-1.5">
            <label className="block text-sm" style={{ color: T.muted }}>Tên triển lãm</label>
            <input
              type="text"
              required
              placeholder="vd. Thiên nhiên và Khảo cổ Sài Gòn"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm" style={{ color: T.muted }}>Mô tả</label>
            <textarea
              placeholder="Nhập mô tả chi tiết về triển lãm..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none"
              style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <label className="block text-sm" style={{ color: T.muted }}>Ngày bắt đầu</label>
              <input
                type="date"
                min={todayStr}
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
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
              <label className="block text-sm" style={{ color: T.muted }}>Ảnh thumbnail</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none file:mr-4 file:rounded-lg file:border-0 file:bg-[rgba(200,155,69,0.15)] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-[#A67C1E]"
                style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 rounded-xl p-3 text-xs leading-relaxed" style={{ background: "rgba(200,155,69,0.08)", border: `1px dashed ${T.border}` }}>
              <p style={{ color: T.text }}>
                <strong style={{ color: T.primaryDark }}>* Lưu ý trạng thái:</strong> Triển lãm mới tạo sẽ mặc định ở trạng thái <span className="font-semibold" style={{ color: T.primaryDark }}>Inactive (Chờ kích hoạt)</span>. Hệ thống sẽ tự động kích hoạt sang <span className="font-semibold" style={{ color: T.success }}>Active</span> khi đến ngày bắt đầu và đổi sang <span className="font-semibold" style={{ color: "#9E2A2B" }}>Ended</span> khi hết hạn. Quản lý nội dung có thể kích hoạt thủ công bất kỳ lúc nào trong trang chi tiết triển lãm.
              </p>
            </div>
          </div>
          {error && <p className="mt-4 text-sm" style={{ color: "#8B2E2E" }}>{error}</p>}
          <div className="mt-4 flex justify-end">
            <button type="submit" disabled={isSubmitting} className="rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-50" style={{ background: T.primary, color: T.surface }}>
              {isSubmitting ? "Đang lưu…" : "Lưu"}
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {exhibitions.length === 0 ? (
          <p className="text-sm" style={{ color: T.muted }}>Chưa có triển lãm.</p>
        ) : (
          exhibitions.map((item) => (
            <Link
              key={item.id}
              href={`/content-manager/exhibition/${item.id}`}
              prefetch={false}
              className="block rounded-3xl p-6 transition-colors hover:opacity-95"
              style={{ background: T.surface, border: `1px solid ${T.border}` }}
            >
              {item.thumbnailUrl ? (
                <div
                  className="mb-4 h-48 overflow-hidden rounded-2xl"
                  style={{ border: `1px solid ${T.border}` }}
                >
                  <img
                    src={item.thumbnailUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              ) : null}
              <h3 className={dashboardTitleClass} style={{ fontFamily: cinzel, color: T.primaryDark }}>
                {item.name || `Triển lãm #${item.id}`}
              </h3>
              <p className="text-xs mt-0.5" style={{ color: T.mutedLight }}>ID: {item.id}</p>
              <div className="mt-3 space-y-2 text-sm" style={{ color: T.muted }}>
                <div className="flex justify-between">
                  <span>Chủ đề</span>
                  <span style={{ color: T.text }}>{item.themeName || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bắt đầu</span>
                  <span style={{ color: T.text }}>{item.startDate?.slice(0, 10) ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kết thúc</span>
                  <span style={{ color: T.text }}>{item.endDate?.slice(0, 10) ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Trạng thái</span>
                  <StatusBadge status={item.status} />
                </div>
              </div>
              <p className="mt-4 text-xs font-medium" style={{ color: T.primaryDark }}>
                Xem chi tiết →
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
