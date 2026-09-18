"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Edit2, Trash2, Tag, Eye, X, Plus, Power, PowerOff, Calendar, Clock } from "lucide-react";
import { dashboardTheme as T, cinzel, dashboardTitleClass } from "@/lib/dashboard-theme";
import type { Ticket } from "@/types";
import type { ExhibitionDto, TicketPromotionDto } from "@/types/api";
import {
  updateTicketTypeEntryForManager,
  deleteTicketTypeEntryForManager,
  publishTicketTypeEntryForManager,
} from "@/services/museum-manager/ticket.service";
import {
  getManagerTicketPromotions,
  createManagerTicketPromotion,
  updateManagerTicketPromotion,
  deleteManagerTicketPromotion,
  toggleManagerTicketPromotion,
  getManagerTicketPromotionDetail,
} from "@/services/museum-manager/ticket-api.service";
import { getDisplayError } from "@/lib/validation";
import { SuccessBanner, useSuccessToast } from "@/components/shared/success-banner";

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value.slice(0, 10);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formFromTicket(ticket: Ticket) {
  return {
    name: ticket.type,
    nameEn: ticket.nameEn ?? "",
    price:
      ticket.rawPrice != null
        ? String(ticket.rawPrice)
        : ticket.price.replace(/[^\d]/g, ""),
    exhibitionId: ticket.exhibitionId != null ? String(ticket.exhibitionId) : "",
    description: ticket.description ?? "",
    descriptionEn: ticket.descriptionEn ?? "",
  };
}

export function TicketDetailPanel({
  initialTicket,
  exhibitions,
  museumId,
}: {
  initialTicket: Ticket;
  exhibitions: ExhibitionDto[];
  museumId: number | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldEdit = searchParams.get("edit") === "true";

  const [ticket, setTicket] = useState<Ticket>(initialTicket);
  const [isEditing, setIsEditing] = useState(shouldEdit);
  const initialForm = formFromTicket(ticket);
  const [name, setName] = useState(initialForm.name);
  const [nameEn, setNameEn] = useState(initialForm.nameEn);
  const [price, setPrice] = useState(initialForm.price);
  const [exhibitionId, setExhibitionId] = useState(initialForm.exhibitionId);
  const [description, setDescription] = useState(initialForm.description);
  const [descriptionEn, setDescriptionEn] = useState(initialForm.descriptionEn);
  const [formSource, setFormSource] = useState(ticket);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success, showSuccess } = useSuccessToast();
  const [promotions, setPromotions] = useState<TicketPromotionDto[]>([]);
  const [loadingPromos, setLoadingPromos] = useState(true);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [promoName, setPromoName] = useState("");
  const [promoDiscountType, setPromoDiscountType] = useState<"Percentage" | "FixedAmount">("Percentage");
  const [promoDiscountValue, setPromoDiscountValue] = useState("");
  const [promoStartDate, setPromoStartDate] = useState("");
  const [promoEndDate, setPromoEndDate] = useState("");
  const [promoDescription, setPromoDescription] = useState("");
  const [promoSubmitting, setPromoSubmitting] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [editingPromoId, setEditingPromoId] = useState<number | null>(null);
  const [viewingPromo, setViewingPromo] = useState<TicketPromotionDto | null>(null);
  const [loadingDetailPromoId, setLoadingDetailPromoId] = useState<number | null>(null);

  const numericTicketId = Number(ticket.id.replace("TK-", ""));

  useEffect(() => {
    if (Number.isNaN(numericTicketId)) return;
    let cancelled = false;
    getManagerTicketPromotions(numericTicketId)
      .then((data) => {
        if (!cancelled) setPromotions(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingPromos(false);
      });
    return () => {
      cancelled = true;
    };
  }, [numericTicketId]);

  if (ticket !== formSource) {
    setFormSource(ticket);
    const next = formFromTicket(ticket);
    setName(next.name);
    setNameEn(next.nameEn);
    setPrice(next.price);
    setExhibitionId(next.exhibitionId);
    setDescription(next.description);
    setDescriptionEn(next.descriptionEn);
  }

  async function loadPromotions() {
    if (Number.isNaN(numericTicketId)) return;
    setLoadingPromos(true);
    try {
      const data = await getManagerTicketPromotions(numericTicketId);
      setPromotions(data);
    } catch {
      // ignore
    } finally {
      setLoadingPromos(false);
    }
  }

  async function handlePublish() {
    if (Number.isNaN(numericTicketId)) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await publishTicketTypeEntryForManager(numericTicketId);
      setTicket((prev) => ({ ...prev, status: "Active" }));
      showSuccess("Đã xuất bản loại vé.");
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Không thể xuất bản loại vé."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Tên là bắt buộc.");
      return;
    }
    if (!price || Number(price) < 0) {
      setError("Vui lòng nhập giá hợp lệ.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const updatedDto = await updateTicketTypeEntryForManager(numericTicketId, {
        name: name.trim(),
        nameEn: nameEn.trim() || undefined,
        price: Number(price),
        description: description.trim() || undefined,
        descriptionEn: descriptionEn.trim() || undefined,
        exhibitionId: exhibitionId ? Number(exhibitionId) : undefined,
        isActive: ticket.status === "Active",
      });

      // Update local ticket state
      setTicket({
        id: ticket.id,
        type: updatedDto.name,
        price: new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
          maximumFractionDigits: 0,
        }).format(updatedDto.price),
        status: updatedDto.status === "Approved" ? "Active" : "Pending",
        description: updatedDto.description,
        exhibitionId: updatedDto.exhibitionId,
        nameEn: updatedDto.nameEn,
        descriptionEn: updatedDto.descriptionEn,
        rawPrice: updatedDto.price,
      });

      setIsEditing(false);
      showSuccess("Đã cập nhật loại vé.");
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Không thể cập nhật loại vé."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Bạn có chắc muốn xóa/ngừng loại vé này?")) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await deleteTicketTypeEntryForManager(numericTicketId);
      router.push("/museum-manager/ticket-application");
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Không thể xóa loại vé."));
      setIsSubmitting(false);
    }
  }

  // Promotion helpers
  function formatDateForInput(dateString: string): string {
    if (!dateString) return "";
    return dateString.substring(0, 10);
  }

  function startEditPromotion(promo: TicketPromotionDto) {
    setEditingPromoId(promo.id);
    setPromoName(promo.name);
    setPromoDiscountType(promo.discountType);
    setPromoDiscountValue(promo.discountValue.toString());
    setPromoStartDate(formatDateForInput(promo.startDate));
    setPromoEndDate(formatDateForInput(promo.endDate));
    setPromoDescription(promo.description || "");
    setShowPromoForm(true);
    setPromoError(null);
  }

  function cancelEditPromotion() {
    setEditingPromoId(null);
    setPromoName("");
    setPromoDiscountType("Percentage");
    setPromoDiscountValue("");
    setPromoStartDate("");
    setPromoEndDate("");
    setPromoDescription("");
    setShowPromoForm(false);
    setPromoError(null);
  }

  async function handleCreateOrUpdatePromotion(e: React.FormEvent) {
    e.preventDefault();
    if (Number.isNaN(numericTicketId)) return;

    setPromoError(null);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sDate = new Date(promoStartDate);
    sDate.setHours(0, 0, 0, 0);

    if (editingPromoId == null) {
      if (sDate < today) {
        setPromoError("Ngày bắt đầu không được ở trong quá khứ.");
        return;
      }
    } else {
      const currentPromo = promotions.find((p) => p.id === editingPromoId);
      const initialStart = currentPromo?.startDate ? currentPromo.startDate.slice(0, 10) : "";
      if (promoStartDate && promoStartDate !== initialStart && sDate < today) {
        setPromoError("Ngày bắt đầu không được ở trong quá khứ.");
        return;
      }
    }

    const eDate = new Date(promoEndDate);
    eDate.setHours(0, 0, 0, 0);
    if (eDate < today) {
      setPromoError("Ngày kết thúc không được ở trong quá khứ.");
      return;
    }

    if (sDate >= eDate) {
      setPromoError("Ngày kết thúc phải diễn ra sau ngày bắt đầu.");
      return;
    }

    setPromoSubmitting(true);

    const payload = {
      name: promoName.trim(),
      discountType: promoDiscountType,
      discountValue: Number(promoDiscountValue),
      startDate: new Date(promoStartDate).toISOString(),
      endDate: new Date(promoEndDate).toISOString(),
      description: promoDescription.trim() || undefined,
      isActive: true,
    };

    try {
      if (editingPromoId != null) {
        await updateManagerTicketPromotion(editingPromoId, payload);
      } else {
        await createManagerTicketPromotion(numericTicketId, payload);
      }
      cancelEditPromotion();
      showSuccess(editingPromoId != null ? "Đã cập nhật khuyến mãi." : "Đã tạo khuyến mãi.");
      await loadPromotions();
    } catch (err) {
      setPromoError(getDisplayError(err, editingPromoId != null ? "Không thể cập nhật khuyến mãi." : "Không thể tạo khuyến mãi."));
    } finally {
      setPromoSubmitting(false);
    }
  }

  async function handleDeletePromotion(promotionId: number, promotionName: string) {
    if (!confirm(`Bạn có chắc muốn xóa khuyến mãi "${promotionName}"?`)) {
      return;
    }

    try {
      await deleteManagerTicketPromotion(promotionId);
      if (editingPromoId === promotionId) {
        cancelEditPromotion();
      }
      showSuccess("Đã xóa khuyến mãi.");
      await loadPromotions();
    } catch (err) {
      setError(getDisplayError(err, "Không thể xóa khuyến mãi."));
    }
  }

  async function handleTogglePromotion(promotionId: number, currentActive: boolean) {
    try {
      await toggleManagerTicketPromotion(promotionId, !currentActive);
      showSuccess(currentActive ? "Đã tắt khuyến mãi." : "Đã bật khuyến mãi.");
      await loadPromotions();
    } catch (err) {
      setError(getDisplayError(err, "Không thể thay đổi trạng thái khuyến mãi."));
    }
  }

  async function handleViewPromoDetail(promotionId: number) {
    setLoadingDetailPromoId(promotionId);
    try {
      const detail = await getManagerTicketPromotionDetail(promotionId);
      setViewingPromo(detail);
    } catch (err) {
      setError(getDisplayError(err, "Không thể tải chi tiết khuyến mãi."));
    } finally {
      setLoadingDetailPromoId(null);
    }
  }

  const exhibition = exhibitions.find((e) => e.id === ticket.exhibitionId);

  return (
    <div className="px-8 pb-10 space-y-6">
      <Link
        href="/museum-manager/ticket-application"
        prefetch={false}
        className="inline-flex items-center gap-2 text-sm transition-colors hover:text-stone-800"
        style={{ color: T.muted }}
      >
        <ArrowLeft className="h-4 w-4" /> Quay lại loại vé
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className={dashboardTitleClass} style={{ fontFamily: cinzel, color: T.text }}>
          {ticket.type}
        </h1>
        <div className="flex items-center gap-3">
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              background: ticket.status === "Active" ? "rgba(79,125,74,0.12)" : "rgba(200,155,69,0.15)",
              color: ticket.status === "Active" ? T.success : T.primaryDark,
            }}
          >
            {ticket.status === "Active"
              ? "Đang hoạt động"
              : ticket.status === "Pending"
                ? "Chờ duyệt"
                : ticket.status === "Inactive"
                  ? "Ngừng hoạt động"
                  : ticket.status}
          </span>
          {ticket.status === "Pending" && (
            <button
              onClick={handlePublish}
              disabled={isSubmitting}
              className="rounded-xl px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
                color: T.surface,
              }}
            >
              Xuất bản vé
            </button>
          )}
        </div>
      </div>

      <SuccessBanner message={success} />
      {error && (
        <p className="rounded-xl px-3 py-2 text-sm" style={{ background: "rgba(180,40,40,0.08)", color: "#8B2E2E" }}>
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Details or Edit Info */}
        <div className="lg:col-span-2 space-y-6">
          <div
            className="rounded-3xl p-6"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}
          >
            <div className="flex justify-between items-center border-b pb-4 mb-4" style={{ borderColor: T.border }}>
              <h2 className={dashboardTitleClass} style={{ fontFamily: cinzel, color: T.text }}>
                {isEditing ? "Sửa loại vé" : "Thông tin vé"}
              </h2>
              {!isEditing && ticket.status !== "Inactive" && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-xl transition-opacity hover:opacity-85"
                  style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                >
                  <Edit2 className="h-3 w-3" /> Sửa
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-sm" style={{ color: T.muted }}>Tên (tiếng Việt) *</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                      style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm" style={{ color: T.muted }}>Tên (tiếng Anh)</label>
                    <input
                      value={nameEn}
                      onChange={(e) => setNameEn(e.target.value)}
                      className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                      style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm" style={{ color: T.muted }}>Giá (VND) *</label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                      className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                      style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm" style={{ color: T.muted }}>Phạm vi / Triển lãm</label>
                    <select
                      value={exhibitionId}
                      onChange={(e) => setExhibitionId(e.target.value)}
                      className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                      style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                    >
                      <option value="">Toàn bảo tàng (Tất cả triển lãm)</option>
                      {exhibitions.map((ex) => (
                        <option key={ex.id} value={ex.id}>{ex.name || `Triển lãm #${ex.id}`}</option>
                      ))}
                    </select>
                    {(() => {
                      const selectedEx = exhibitions.find((e) => String(e.id) === String(exhibitionId));
                      if (selectedEx) {
                        return (
                          <div className="mt-1.5 rounded-xl p-2.5 text-xs border border-dashed" style={{ background: "rgba(200,155,69,0.08)", borderColor: T.border, color: T.primaryDark }}>
                            <p className="font-semibold flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-amber-700" />
                              Thời hạn vé: {formatDate(selectedEx.startDate)} → {formatDate(selectedEx.endDate)}
                            </p>
                            <p className="text-[11px] mt-1" style={{ color: T.muted }}>
                              * Vé tự động hết hạn vào 23:59:59 ngày bế mạc triển lãm và tự động ngừng bán khi triển lãm kết thúc.
                            </p>
                          </div>
                        );
                      }
                      return (
                        <div className="mt-1.5 rounded-xl p-2.5 text-xs border border-dashed" style={{ background: "rgba(16,185,129,0.06)", borderColor: "rgba(16,185,129,0.25)", color: "#047857" }}>
                          <p className="font-semibold flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            Thời hạn vé: Không thời hạn
                          </p>
                          <p className="text-[11px] mt-1" style={{ color: T.muted }}>
                            * Vé tham quan cố định toàn bảo tàng không bị giới hạn ngày sử dụng.
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-sm" style={{ color: T.muted }}>Mô tả (tiếng Việt)</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full resize-none rounded-xl px-4 py-2.5 text-sm outline-none"
                      style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm" style={{ color: T.muted }}>Mô tả (tiếng Anh)</label>
                    <textarea
                      value={descriptionEn}
                      onChange={(e) => setDescriptionEn(e.target.value)}
                      rows={3}
                      className="w-full resize-none rounded-xl px-4 py-2.5 text-sm outline-none"
                      style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" /> Xóa loại vé
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="rounded-xl px-4 py-2 text-sm"
                      style={{ border: `1px solid ${T.border}`, color: T.muted }}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-50"
                      style={{
                        background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
                        color: T.surface,
                      }}
                    >
                      {isSubmitting ? "Đang lưu…" : "Lưu thay đổi"}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-5 text-sm">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider" style={{ color: T.muted }}>ID</span>
                    <span className="text-base font-semibold" style={{ color: T.text }}>{ticket.id}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider" style={{ color: T.muted }}>Giá</span>
                    <span className="text-base font-bold" style={{ color: T.text }}>{ticket.price}</span>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider" style={{ color: T.muted }}>Tên (tiếng Việt)</span>
                    <span className="text-base font-semibold" style={{ color: T.text }}>{ticket.type}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider" style={{ color: T.muted }}>Tên (tiếng Anh)</span>
                    <span className="text-base" style={{ color: T.text }}>{ticket.nameEn || <span className="italic" style={{ color: T.mutedLight }}>—</span>}</span>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider" style={{ color: T.muted }}>Phạm vi / Triển lãm</span>
                    <span className="text-base font-semibold block mt-0.5" style={{ color: T.text }}>
                      {exhibition ? exhibition.name : "Toàn bảo tàng (Tất cả triển lãm)"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider" style={{ color: T.muted }}>Thời hạn vé</span>
                    <div className="mt-1">
                      {exhibition ? (
                        <div className="space-y-1">
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
                            style={{ background: "rgba(200,155,69,0.18)", color: "#8C6214", border: `1px solid ${T.border}` }}
                          >
                            <Calendar className="h-3.5 w-3.5 text-amber-700" />
                            Theo triển lãm: {formatDate(exhibition.startDate)} → {formatDate(exhibition.endDate)}
                          </span>
                          <p className="text-xs leading-relaxed" style={{ color: T.muted }}>
                            * Vé hết hạn vào 23:59:59 của ngày bế mạc triển lãm và tự động ngừng bán khi triển lãm kết thúc.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
                            style={{ background: "rgba(16,185,129,0.12)", color: "#047857", border: "1px solid rgba(16,185,129,0.3)" }}
                          >
                            <Clock className="h-3.5 w-3.5" />
                            Không thời hạn
                          </span>
                          <p className="text-xs leading-relaxed" style={{ color: T.muted }}>
                            * Vé tham quan cố định không giới hạn thời gian sử dụng, du khách có thể check-in vào bất kỳ ngày nào.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider" style={{ color: T.muted }}>Mô tả (tiếng Việt)</span>
                    <p className="mt-1 leading-relaxed" style={{ color: T.text }}>
                      {ticket.description || <span className="italic" style={{ color: T.mutedLight }}>Không có mô tả</span>}
                    </p>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider" style={{ color: T.muted }}>Mô tả (tiếng Anh)</span>
                    <p className="mt-1 leading-relaxed" style={{ color: T.text }}>
                      {ticket.descriptionEn || <span className="italic" style={{ color: T.mutedLight }}>Chưa có mô tả tiếng Anh</span>}
                    </p>
                  </div>
                </div>

                {ticket.status !== "Inactive" && (
                  <div className="border-t pt-4 flex justify-end">
                    <button
                      onClick={handleDelete}
                      className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" /> Xóa loại vé
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Promotions List & Manage */}
        <div className="space-y-6">
          <div
            className="rounded-3xl p-6 space-y-4"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}
          >
            <div className="flex justify-between items-center border-b pb-3 mb-2" style={{ borderColor: T.border }}>
              <h3 className={`${dashboardTitleClass} flex items-center gap-1.5`} style={{ color: T.text }}>
                <Tag className="h-4 w-4 text-red-600" /> Khuyến mãi
              </h3>
              {!showPromoForm && ticket.status !== "Inactive" && (
                <button
                  onClick={() => setShowPromoForm(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold bg-red-50 text-red-600 border border-red-200/50 rounded-xl px-2.5 py-1 transition-opacity hover:opacity-85"
                >
                  <Plus className="h-3.5 w-3.5" /> Thêm
                </button>
              )}
            </div>

            {showPromoForm && (
              <form onSubmit={handleCreateOrUpdatePromotion} className="space-y-3 p-4 rounded-2xl bg-stone-50 border" style={{ borderColor: T.border }}>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-red-600">
                    {editingPromoId != null ? "Sửa khuyến mãi" : "Khuyến mãi mới"}
                  </h4>
                  <button
                    type="button"
                    onClick={cancelEditPromotion}
                    className="p-1 rounded-full hover:bg-stone-200"
                  >
                    <X className="h-3.5 w-3.5" style={{ color: T.muted }} />
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="space-y-1">
                    <label className="block font-semibold" style={{ color: T.muted }}>Tên *</label>
                    <input
                      value={promoName}
                      onChange={(e) => setPromoName(e.target.value)}
                      placeholder="Giảm giá ngày lễ"
                      required
                      className="w-full rounded-lg px-3 py-2 outline-none"
                      style={{ border: `1px solid ${T.border}`, background: T.surface, color: T.text }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block font-semibold" style={{ color: T.muted }}>Loại *</label>
                      <select
                        value={promoDiscountType}
                        onChange={(e) => setPromoDiscountType(e.target.value as "Percentage" | "FixedAmount")}
                        className="w-full rounded-lg px-2.5 py-2 outline-none"
                        style={{ border: `1px solid ${T.border}`, background: T.surface, color: T.text }}
                      >
                        <option value="Percentage">Phần trăm</option>
                        <option value="FixedAmount">Số tiền cố định</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block font-semibold" style={{ color: T.muted }}>
                        Giá trị * {promoDiscountType === "Percentage" ? "(%)" : "(VND)"}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={promoDiscountValue}
                        onChange={(e) => setPromoDiscountValue(e.target.value)}
                        required
                        className="w-full rounded-lg px-3 py-2 outline-none"
                        style={{ border: `1px solid ${T.border}`, background: T.surface, color: T.text }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block font-semibold" style={{ color: T.muted }}>Ngày bắt đầu *</label>
                      <input
                        type="date"
                        value={promoStartDate}
                        min={editingPromoId != null ? undefined : new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)}
                        onChange={(e) => setPromoStartDate(e.target.value)}
                        required
                        className="w-full rounded-lg px-2 py-2 outline-none"
                        style={{ border: `1px solid ${T.border}`, background: T.surface, color: T.text }}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block font-semibold" style={{ color: T.muted }}>Ngày kết thúc *</label>
                      <input
                        type="date"
                        value={promoEndDate}
                        min={promoStartDate || new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)}
                        onChange={(e) => setPromoEndDate(e.target.value)}
                        required
                        className="w-full rounded-lg px-2 py-2 outline-none"
                        style={{ border: `1px solid ${T.border}`, background: T.surface, color: T.text }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold" style={{ color: T.muted }}>Mô tả</label>
                    <input
                      value={promoDescription}
                      onChange={(e) => setPromoDescription(e.target.value)}
                      placeholder="Chi tiết (không bắt buộc)"
                      className="w-full rounded-lg px-3 py-2 outline-none"
                      style={{ border: `1px solid ${T.border}`, background: T.surface, color: T.text }}
                    />
                  </div>
                </div>

                {promoError && (
                  <p className="text-[11px]" style={{ color: "#8B2E2E" }}>{promoError}</p>
                )}

                <div className="flex justify-end gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={cancelEditPromotion}
                    className="rounded-lg px-3 py-1.5 text-xs border bg-stone-100"
                    style={{ borderColor: T.border, color: T.muted }}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={promoSubmitting}
                    className="rounded-lg px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)" }}
                  >
                    {promoSubmitting ? "Đang lưu…" : "Lưu"}
                  </button>
                </div>
              </form>
            )}

            {loadingPromos ? (
              <p className="text-xs" style={{ color: T.muted }}>Đang tải khuyến mãi...</p>
            ) : promotions.length === 0 ? (
              <p className="text-xs italic" style={{ color: T.mutedLight }}>Chưa có khuyến mãi.</p>
            ) : (
              <div className="space-y-2.5">
                {promotions.map((promo) => {
                  const now = new Date();
                  const start = new Date(promo.startDate);
                  const end = new Date(promo.endDate);
                  const isCurrentlyActive = promo.isActive && start <= now && end >= now;
                  const isExpired = end < now;

                  return (
                    <div
                      key={promo.id}
                      className="flex flex-col gap-2 rounded-xl p-3 border text-xs"
                      style={{
                        background: isCurrentlyActive ? "rgba(79,125,74,0.04)" : "rgba(200,155,69,0.03)",
                        borderColor: isCurrentlyActive ? "rgba(79,125,74,0.15)" : T.border,
                      }}
                    >
                      <div className="flex justify-between items-start gap-1">
                        <div>
                          <span className="font-semibold block" style={{ color: T.text }}>{promo.name}</span>
                          <span
                            className="inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold mt-1"
                            style={{
                              background: isCurrentlyActive ? "rgba(79,125,74,0.12)" : isExpired ? "rgba(139,58,58,0.10)" : "rgba(200,155,69,0.15)",
                              color: isCurrentlyActive ? T.success : isExpired ? "#8B3A3A" : T.primaryDark,
                            }}
                          >
                            {isCurrentlyActive ? "🟢 Đang diễn ra" : isExpired ? "⏰ Hết hạn" : promo.isActive ? "⏳ Đã lên lịch" : "⏸ Tạm dừng"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleViewPromoDetail(promo.id)}
                            className="p-1 hover:bg-stone-100 rounded text-indigo-600"
                            title="Xem"
                            disabled={loadingDetailPromoId === promo.id}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => startEditPromotion(promo)}
                            className="p-1 hover:bg-stone-100 rounded text-blue-600"
                            title="Sửa"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePromotion(promo.id, promo.name)}
                            className="p-1 hover:bg-stone-100 rounded text-red-600"
                            title="Xóa"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleTogglePromotion(promo.id, promo.isActive)}
                            className="p-1 hover:bg-stone-100 rounded"
                            title={promo.isActive ? "Tạm dừng" : "Tiếp tục"}
                            style={{ color: promo.isActive ? T.success : T.muted }}
                          >
                            {promo.isActive ? <Power className="h-3.5 w-3.5" /> : <PowerOff className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="border-t pt-2 mt-1" style={{ borderColor: T.border }}>
                        <p style={{ color: T.muted }}>
                          <span className="font-semibold text-red-600">
                            {promo.discountType === "Percentage" ? `Giảm ${promo.discountValue}%` : `Giảm ${promo.discountValue.toLocaleString("vi-VN")} VND`}
                          </span>
                          {` · `}
                          {start.toLocaleDateString("vi-VN")} → {end.toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Promotion Detail Modal */}
      {viewingPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-lg overflow-hidden rounded-3xl p-6 space-y-4 shadow-2xl"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: T.border }}>
              <h3 className={`${dashboardTitleClass} flex items-center gap-2`} style={{ fontFamily: cinzel, color: T.text }}>
                <Tag className="h-5 w-5 text-red-600" /> Chi tiết khuyến mãi
              </h3>
              <button
                type="button"
                onClick={() => setViewingPromo(null)}
                className="rounded-full p-1.5 hover:bg-stone-100 transition-colors"
                style={{ color: T.muted }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-sm">
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider" style={{ color: T.muted }}>Tên</span>
                <span className="text-base font-semibold" style={{ color: T.text }}>{viewingPromo.name}</span>
              </div>

              {viewingPromo.nameEn && (
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider" style={{ color: T.muted }}>Tên tiếng Anh</span>
                  <span className="text-base" style={{ color: T.text }}>{viewingPromo.nameEn}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider" style={{ color: T.muted }}>Giá trị giảm</span>
                  <span className="text-base font-bold text-red-600">
                    {viewingPromo.discountType === "Percentage"
                      ? `${viewingPromo.discountValue}%`
                      : `${viewingPromo.discountValue.toLocaleString()} VND`}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider" style={{ color: T.muted }}>Loại</span>
                  <span className="text-base" style={{ color: T.text }}>
                    {viewingPromo.discountType === "Percentage"
                      ? "Phần trăm"
                      : viewingPromo.discountType === "FixedAmount"
                        ? "Số tiền cố định"
                        : viewingPromo.discountType}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider" style={{ color: T.muted }}>Ngày bắt đầu</span>
                  <span className="text-base" style={{ color: T.text }}>
                    {new Date(viewingPromo.startDate).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider" style={{ color: T.muted }}>Ngày kết thúc</span>
                  <span className="text-base" style={{ color: T.text }}>
                    {new Date(viewingPromo.endDate).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider" style={{ color: T.muted }}>Mô tả</span>
                <p className="mt-0.5 leading-relaxed font-sans" style={{ color: T.text }}>
                  {viewingPromo.description || <span className="italic" style={{ color: T.mutedLight }}>Không có mô tả</span>}
                </p>
              </div>

              <div className="border-t pt-3 flex justify-end" style={{ borderColor: T.border }}>
                <button
                  type="button"
                  onClick={() => setViewingPromo(null)}
                  className="rounded-xl px-5 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
                  style={{
                    background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
                    color: T.surface,
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
