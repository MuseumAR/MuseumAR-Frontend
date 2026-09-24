"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { Plus, Download, FileArchive, CheckCircle2, Clock, AlertTriangle, Layers, Landmark } from "lucide-react";
import { dashboardTheme as T, cinzel, dashboardTitleClass } from "@/lib/dashboard-theme";
import { getDisplayError } from "@/lib/validation";
import { labelStatus } from "@/lib/status-labels";
import { getApiUrl } from "@/services/api-client";
import { getAuthUser } from "@/services/auth/auth.storage";
import { generatePackageEntry } from "@/services/content-manager/offline-package.service";
import type { ContentVersionDto, ExhibitionDto, OfflinePackageDto } from "@/types/api";

function formatBytes(bytes?: number | null) {
  if (!bytes || bytes <= 0) return "—";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

function getPackageDownloadUrl(packageUrl?: string | null) {
  if (!packageUrl) return "#";
  if (packageUrl.startsWith("http://") || packageUrl.startsWith("https://")) {
    return packageUrl;
  }
  const cleanPath = packageUrl.startsWith("/") ? packageUrl : `/${packageUrl}`;
  try {
    return getApiUrl(cleanPath);
  } catch {
    return "#";
  }
}

export function OfflinePackagesPanel({
  packages,
  versions = [],
  exhibitions = [],
}: {
  packages: OfflinePackageDto[];
  versions?: ContentVersionDto[];
  exhibitions?: ExhibitionDto[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [versionId, setVersionId] = useState("");
  const [scopeType, setScopeType] = useState<"all" | "exhibition">("all");
  const [selectedExhibitionId, setSelectedExhibitionId] = useState("");
  const [packageName, setPackageName] = useState("");
  const [packageNameEn, setPackageNameEn] = useState("");
  const [packageDesc, setPackageDesc] = useState("");
  const [packageDescEn, setPackageDescEn] = useState("");
  const [filterScope, setFilterScope] = useState<"all" | "museum_only" | "exhibition_only">("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const latestVersion = versions.length > 0
    ? versions.reduce((max, v) => (v.id > max.id ? v : max), versions[0])
    : null;

  const activeExhibitions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return exhibitions.filter((ex) => {
      if (ex.status === "Ended" || ex.status === "Closed") return false;
      if (ex.endDate) {
        const end = new Date(ex.endDate);
        if (end < today) return false;
      }
      return true;
    });
  }, [exhibitions]);

  const filteredPackages = useMemo(() => {
    let list = packages;
    if (filterScope === "museum_only") {
      list = packages.filter((p) => !p.exhibitionId);
    } else if (filterScope === "exhibition_only") {
      list = packages.filter((p) => !!p.exhibitionId);
    }
    return [...list].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (timeB !== timeA) return timeB - timeA;
      return b.id - a.id;
    });
  }, [packages, filterScope]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const vid = Number(versionId);
    if (!versionId || Number.isNaN(vid)) {
      setError("Vui lòng chọn phiên bản nội dung.");
      return;
    }

    if (latestVersion && vid !== latestVersion.id) {
      setError(`Chỉ phiên bản mới nhất (v${latestVersion.versionNumber || latestVersion.id}) mới dùng để tạo gói offline.`);
      return;
    }

    const exId = scopeType === "exhibition" && selectedExhibitionId ? Number(selectedExhibitionId) : null;
    if (scopeType === "exhibition" && (!selectedExhibitionId || Number.isNaN(exId))) {
      setError("Vui lòng chọn chuyên đề triển lãm cụ thể.");
      return;
    }

    const hasExistingPackage = packages.some(
      (p) => p.versionId === vid && (exId == null ? !p.exhibitionId : p.exhibitionId === exId)
    );
    if (hasExistingPackage) {
      setError(exId ? "Gói offline cho triển lãm này ở phiên bản đã chọn đã tồn tại." : "Gói offline toàn bảo tàng cho phiên bản này đã tồn tại.");
      return;
    }

    const museumId = getAuthUser()?.museumId;
    if (museumId == null || museumId <= 0) {
      setError("Không xác định được bảo tàng của tài khoản này.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await generatePackageEntry({
        versionId: vid,
        museumId,
        exhibitionId: exId,
        packageName: packageName.trim() || undefined,
        packageNameEn: packageNameEn.trim() || undefined,
        description: packageDesc.trim() || undefined,
        descriptionEn: packageDescEn.trim() || undefined,
      });
      setShowForm(false);
      setVersionId("");
      setSelectedExhibitionId("");
      setPackageName("");
      setPackageNameEn("");
      setPackageDesc("");
      setPackageDescEn("");
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Không thể tạo gói offline."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 px-8 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className={dashboardTitleClass} style={{ fontFamily: cinzel, color: T.text }}>
            Gói offline ({packages.length})
          </h2>
          <p className="text-xs mt-0.5" style={{ color: T.mutedLight }}>
            Quản lý và tải gói dữ liệu nén (.zip) theo Toàn bảo tàng hoặc Triển lãm chuyên đề
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter scope */}
          <div className="flex rounded-xl p-1 text-xs" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <button
              type="button"
              onClick={() => setFilterScope("all")}
              className={`rounded-lg px-3 py-1.5 font-medium transition-all ${filterScope === "all" ? "shadow-sm font-semibold" : ""}`}
              style={{
                background: filterScope === "all" ? T.primary : "transparent",
                color: filterScope === "all" ? T.surface : T.muted,
              }}
            >
              Tất cả ({packages.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterScope("museum_only")}
              className={`rounded-lg px-3 py-1.5 font-medium transition-all ${filterScope === "museum_only" ? "shadow-sm font-semibold" : ""}`}
              style={{
                background: filterScope === "museum_only" ? T.primary : "transparent",
                color: filterScope === "museum_only" ? T.surface : T.muted,
              }}
            >
              🏛️ Toàn bảo tàng
            </button>
            <button
              type="button"
              onClick={() => setFilterScope("exhibition_only")}
              className={`rounded-lg px-3 py-1.5 font-medium transition-all ${filterScope === "exhibition_only" ? "shadow-sm font-semibold" : ""}`}
              style={{
                background: filterScope === "exhibition_only" ? T.primary : "transparent",
                color: filterScope === "exhibition_only" ? T.surface : T.muted,
              }}
            >
              🎨 Triển lãm chuyên đề
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold shadow-sm transition-opacity hover:opacity-90"
            style={{
              background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
              color: T.surface,
            }}
          >
            <Plus className="h-4 w-4" />
            Tạo gói offline
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="max-w-lg rounded-3xl p-6 shadow-sm space-y-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <h3 className={`${dashboardTitleClass}`} style={{ color: T.primaryDark }}>Tạo gói ZIP offline mới</h3>
          
          {/* Phiên bản nội dung */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold" style={{ color: T.muted }}>Phiên bản nội dung *</label>
            {versions.length === 0 ? (
              <p className="text-xs" style={{ color: T.muted }}>
                Chưa có phiên bản nội dung. Tạo trước tại{" "}
                <a
                  href="/content-manager/content-versions"
                  className="font-semibold underline-offset-2 hover:underline"
                  style={{ color: T.primaryDark }}
                >
                  Phiên bản nội dung
                </a>
                .
              </p>
            ) : (
              <select
                required
                value={versionId}
                onChange={(e) => setVersionId(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
              >
                <option value="">-- Chọn phiên bản --</option>
                {versions.map((v) => {
                  const isLatest = latestVersion && v.id === latestVersion.id;
                  return (
                    <option key={v.id} value={v.id}>
                      {v.versionNumber ? `v${v.versionNumber}` : `Phiên bản`} (ID {v.id})
                      {v.status ? ` · ${v.status}` : ""}
                      {isLatest ? " (Mới nhất)" : " (Cũ hơn)"}
                      {v.changeDescription ? ` — ${v.changeDescription}` : ""}
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {/* Phạm vi đóng gói */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold" style={{ color: T.muted }}>Phạm vi đóng gói *</label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-2.5 p-3 rounded-2xl cursor-pointer border transition-all ${
                  scopeType === "all" ? "border-[#C89B3C] bg-[#C89B3C]/10" : "border-[#EDE4D4]"
                }`}
              >
                <input
                  type="radio"
                  name="scopeType"
                  value="all"
                  checked={scopeType === "all"}
                  onChange={() => setScopeType("all")}
                  className="accent-[#C89B3C]"
                />
                <div>
                  <p className="text-xs font-bold" style={{ color: T.text }}>🏛️ Toàn bảo tàng</p>
                  <p className="text-[11px]" style={{ color: T.mutedLight }}>Tất cả hiện vật chung</p>
                </div>
              </label>

              <label
                className={`flex items-center gap-2.5 p-3 rounded-2xl cursor-pointer border transition-all ${
                  scopeType === "exhibition" ? "border-[#C89B3C] bg-[#C89B3C]/10" : "border-[#EDE4D4]"
                }`}
              >
                <input
                  type="radio"
                  name="scopeType"
                  value="exhibition"
                  checked={scopeType === "exhibition"}
                  onChange={() => setScopeType("exhibition")}
                  className="accent-[#C89B3C]"
                />
                <div>
                  <p className="text-xs font-bold" style={{ color: T.text }}>🎨 Triển lãm chuyên đề</p>
                  <p className="text-[11px]" style={{ color: T.mutedLight }}>Chỉ hiện vật của triển lãm</p>
                </div>
              </label>
            </div>
          </div>

          {/* Chọn triển lãm nếu chọn Triển lãm chuyên đề */}
          {scopeType === "exhibition" && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold" style={{ color: T.muted }}>Chọn triển lãm chuyên đề *</label>
              {activeExhibitions.length === 0 ? (
                <p className="text-xs italic" style={{ color: T.danger }}>Không có chuyên đề triển lãm nào đang diễn ra hoặc khả dụng.</p>
              ) : (
                <select
                  required
                  value={selectedExhibitionId}
                  onChange={(e) => setSelectedExhibitionId(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                  style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                >
                  <option value="">-- Chọn chuyên đề triển lãm --</option>
                  {activeExhibitions.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name || `Triển lãm #${ex.id}`} {ex.status ? `(${ex.status})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Tên gói hiển thị */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold" style={{ color: T.muted }}>Tên gói dữ liệu (VI - Tùy chọn)</label>
            <input
              type="text"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              placeholder="VD: Gói tham quan Chuyên đề Đông Sơn v1.2"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold" style={{ color: T.muted }}>Tên gói dữ liệu (EN - Tùy chọn)</label>
            <input
              type="text"
              value={packageNameEn}
              onChange={(e) => setPackageNameEn(e.target.value)}
              placeholder="VD: Dong Son Culture Tour Package v1.2"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold" style={{ color: T.muted }}>Mô tả gói dữ liệu (VI - Tùy chọn)</label>
            <textarea
              rows={2}
              value={packageDesc}
              onChange={(e) => setPackageDesc(e.target.value)}
              placeholder="Mô tả nội dung gói dữ liệu offline..."
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold" style={{ color: T.muted }}>Mô tả gói dữ liệu (EN - Tùy chọn)</label>
            <textarea
              rows={2}
              value={packageDescEn}
              onChange={(e) => setPackageDescEn(e.target.value)}
              placeholder="Offline package description in English..."
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
            />
          </div>

          {error && <p className="text-xs font-medium" style={{ color: "#8B2E2E" }}>{error}</p>}
          
          <div className="mt-4 flex justify-end gap-2 pt-2 border-t" style={{ borderColor: T.border }}>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl px-4 py-2 text-xs font-semibold"
              style={{ border: `1px solid ${T.border}`, color: T.text }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || versions.length === 0 || (scopeType === "exhibition" && activeExhibitions.length === 0)}
              className="rounded-xl px-5 py-2 text-xs font-semibold disabled:opacity-50"
              style={{ background: T.primary, color: T.surface }}
            >
              {isSubmitting ? "Đang đóng gói ZIP…" : "Bắt đầu tạo"}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-3xl shadow-sm" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        {filteredPackages.length === 0 ? (
          <div className="px-8 py-16 text-center text-sm font-medium" style={{ color: T.muted }}>
            {packages.length === 0
              ? "Chưa có gói offline nào. Dùng nút phía trên để tạo gói ZIP mới."
              : "Không có gói offline nào khớp với bộ lọc phạm vi đã chọn."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}`, background: "rgba(245,230,200,0.35)" }}>
                  {["Mã gói", "Phạm vi / Triển lãm", "Phiên bản", "Trạng thái", "Dung lượng", "Hiện vật & Media", "Ngày tạo", "Thao tác"].map((h) => (
                    <th key={h} className="px-5 py-4 font-semibold text-xs uppercase tracking-wider" style={{ color: T.mutedLight }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPackages.map((pkg) => {
                  const isAvailable = pkg.status === "Available";
                  const downloadUrl = getPackageDownloadUrl(pkg.packageUrl);
                  const isExhibitionScoped = Boolean(pkg.exhibitionId);

                  // Check if the exhibition is ended
                  const matchedExhibition = isExhibitionScoped
                    ? exhibitions.find((e) => e.id === pkg.exhibitionId)
                    : null;
                  const isExhibitionEnded = matchedExhibition
                    ? matchedExhibition.status === "Ended" ||
                      matchedExhibition.status === "Closed" ||
                      (matchedExhibition.endDate && new Date(matchedExhibition.endDate) < new Date(new Date().setHours(0, 0, 0, 0)))
                    : false;

                  return (
                    <tr key={pkg.id} className="transition-colors hover:bg-[rgba(200,155,69,0.05)]" style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td className="px-5 py-4 font-mono font-bold" style={{ color: T.text }}>
                        #{pkg.id}
                      </td>

                      {/* Scope column */}
                      <td className="px-5 py-4">
                        {isExhibitionScoped ? (
                          <div className="flex flex-col gap-1 items-start">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                                style={{
                                  background: isExhibitionEnded ? "rgba(180,40,40,0.1)" : "rgba(200,155,69,0.18)",
                                  color: isExhibitionEnded ? T.danger : T.primaryDark,
                                  border: `1px solid ${isExhibitionEnded ? "rgba(180,40,40,0.25)" : "rgba(200,155,69,0.3)"}`,
                                }}
                              >
                                <Layers className="h-3 w-3" />
                                {isExhibitionEnded ? "Chuyên đề (Đã kết thúc)" : "Chuyên đề"}
                              </span>
                            </div>
                            <span className="text-xs font-medium" style={{ color: isExhibitionEnded ? T.muted : T.text }}>
                              {pkg.exhibitionTitle || pkg.packageName || `Triển lãm #${pkg.exhibitionId}`}
                            </span>
                            {pkg.packageNameEn && (
                              <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
                                EN: {pkg.packageNameEn}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1 items-start">
                            <span
                              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                              style={{
                                background: "rgba(100,116,139,0.12)",
                                color: "#475569",
                                border: "1px solid rgba(100,116,139,0.25)",
                              }}
                            >
                              <Landmark className="h-3 w-3" />
                              Toàn bảo tàng
                            </span>
                            {pkg.packageName && (
                              <span className="text-xs font-medium" style={{ color: T.muted }}>
                                {pkg.packageName}
                              </span>
                            )}
                            {pkg.packageNameEn && (
                              <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
                                EN: {pkg.packageNameEn}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 font-mono text-xs" style={{ color: T.muted }}>
                        v{pkg.versionId}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                          style={{
                            background: isAvailable
                              ? "rgba(79,125,74,0.12)"
                              : pkg.status === "Building"
                              ? "rgba(200,155,69,0.15)"
                              : "rgba(180,40,40,0.12)",
                            color: isAvailable
                              ? T.success
                              : pkg.status === "Building"
                              ? T.primaryDark
                              : T.danger,
                          }}
                        >
                          {isAvailable ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : pkg.status === "Building" ? (
                            <Clock className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <AlertTriangle className="h-3.5 w-3.5" />
                          )}
                          {labelStatus(pkg.status) || "—"}
                        </span>
                      </td>

                      <td className="px-5 py-4 font-mono text-xs font-medium" style={{ color: T.text }}>
                        {formatBytes(pkg.packageSizeBytes)}
                      </td>

                      <td className="px-5 py-4 text-xs" style={{ color: T.muted }}>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-stone-800">🏛️ Hiện vật: {pkg.exhibitCount ?? 0}</span>
                          <span>📷 Ảnh: {pkg.imageCount ?? 0} · 🔊 Audio: {pkg.audioCount ?? 0} · 🧊 3D: {pkg.arassetCount ?? 0}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-xs" style={{ color: T.muted }}>
                        {pkg.createdAt?.slice(0, 10) ?? "—"}
                      </td>

                      <td className="px-5 py-4">
                        {isAvailable && pkg.packageUrl ? (
                          <a
                            href={downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-transform active:scale-95 hover:opacity-90"
                            style={{
                              background: T.primary,
                              color: T.surface,
                            }}
                          >
                            <Download className="h-3.5 w-3.5" />
                            Tải ZIP
                          </a>
                        ) : (
                          <span className="text-xs italic" style={{ color: T.mutedLight }}>
                            {pkg.status === "Building" ? "Đang xử lý…" : "Không khả dụng"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

