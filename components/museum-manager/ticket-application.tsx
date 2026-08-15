"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus, Tag, Power, PowerOff, Edit2, Trash2, X, Eye } from "lucide-react";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import type { Ticket } from "@/types";
import { getExhibitionList } from "@/services/content-manager/exhibition.service";
import type { ExhibitionDto, TicketPromotionDto } from "@/types/api";
import {
  createTicketTypeEntryForManager,
  publishTicketTypeEntryForManager,
  deleteTicketTypeEntryForManager,
} from "@/services/museum-manager/ticket.service";
import {
  getManagerTicketPromotions,
  createManagerTicketPromotion,
  updateManagerTicketPromotion,
  deleteManagerTicketPromotion,
  toggleManagerTicketPromotion,
  getManagerTicketPromotionDetail,
} from "@/services/museum-manager/ticket-api.service";
import {
  getDisplayError,
  getFirstValidationError,
  validateCreateTicketType,
} from "@/lib/validation";
import { labelStatus } from "@/lib/status-labels";
import { SuccessBanner, useSuccessToast } from "@/components/shared/success-banner";

export function TicketApplicationTable({
  tickets,
  museumId,
  museumName,
}: {
  tickets: Ticket[];
  museumId: number | null;
  museumName?: string | null;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [exhibitionId, setExhibitionId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublishing, setIsPublishing] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const { success, showSuccess } = useSuccessToast();
  const [exhibitions, setExhibitions] = useState<ExhibitionDto[]>([]);

  // Promotion states
  const [promoFormTarget, setPromoFormTarget] = useState<string | null>(null); // ticket.id like "TK-1"
  const [promoName, setPromoName] = useState("");
  const [promoDiscountType, setPromoDiscountType] = useState<"Percentage" | "FixedAmount">("Percentage");
  const [promoDiscountValue, setPromoDiscountValue] = useState("");
  const [promoStartDate, setPromoStartDate] = useState("");
  const [promoEndDate, setPromoEndDate] = useState("");
  const [promoDescription, setPromoDescription] = useState("");
  const [promoSubmitting, setPromoSubmitting] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promotionsByTicket, setPromotionsByTicket] = useState<Record<string, TicketPromotionDto[]>>({});
  const [loadingPromos, setLoadingPromos] = useState<Record<string, boolean>>({});

  // Editing & Detail states
  const [editingPromoId, setEditingPromoId] = useState<number | null>(null);
  const [viewingPromo, setViewingPromo] = useState<TicketPromotionDto | null>(null);
  const [loadingDetailPromoId, setLoadingDetailPromoId] = useState<number | null>(null);

  useEffect(() => {
    if (museumId) {
      getExhibitionList().then((list) => {
        const filtered = list.filter((ex) => ex.museumId === museumId);
        setExhibitions(filtered);
      });
    }
  }, [museumId]);

  const canCreate = museumId != null && museumId > 0;

  function getTicketTypeNumericId(ticketId: string): number {
    return Number(ticketId.replace("TK-", ""));
  }

  async function loadPromotions(ticketId: string) {
    const numericId = getTicketTypeNumericId(ticketId);
    if (Number.isNaN(numericId)) return;

    setLoadingPromos((prev) => ({ ...prev, [ticketId]: true }));
    try {
      const promos = await getManagerTicketPromotions(numericId);
      setPromotionsByTicket((prev) => ({ ...prev, [ticketId]: promos }));
    } catch {
      // silently ignore
    } finally {
      setLoadingPromos((prev) => ({ ...prev, [ticketId]: false }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (museumId == null) {
      setError("Museum profile is not available.");
      return;
    }

    const validation = validateCreateTicketType({ museumId, name, price });
    if (!validation.valid) {
      setError(getFirstValidationError(validation));
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await createTicketTypeEntryForManager({
        museumId,
        name: name.trim(),
        nameEn: nameEn.trim() || undefined,
        price: Number(price),
        description: description.trim() || undefined,
        descriptionEn: descriptionEn.trim() || undefined,
        exhibitionId: exhibitionId.trim() ? Number(exhibitionId) : undefined,
        isActive: true,
      });
      setShowForm(false);
      setName("");
      setNameEn("");
      setPrice("");
      setDescription("");
      setDescriptionEn("");
      setExhibitionId("");
      showSuccess("Ticket type created.");
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Could not create ticket type. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePublish(ticketId: string) {
    const numericId = getTicketTypeNumericId(ticketId);
    if (Number.isNaN(numericId)) return;

    setIsPublishing((prev) => ({ ...prev, [ticketId]: true }));
    setError(null);

    try {
      await publishTicketTypeEntryForManager(numericId);
      showSuccess("Ticket type published.");
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Could not publish ticket type. Please try again."));
    } finally {
      setIsPublishing((prev) => ({ ...prev, [ticketId]: false }));
    }
  }

  async function handleDeleteTicket(ticketId: string) {
    if (!confirm("Are you sure you want to delete/deactivate this ticket type?")) {
      return;
    }
    const numericId = getTicketTypeNumericId(ticketId);
    if (Number.isNaN(numericId)) return;

    setError(null);
    try {
      await deleteTicketTypeEntryForManager(numericId);
      showSuccess("Ticket type deleted.");
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Could not delete ticket type."));
    }
  }

  // Convert Date from API (ISO format) to local Date input string (YYYY-MM-DD)
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
    setPromoError(null);
  }

  async function handleCreateOrUpdatePromotion(e: React.FormEvent, ticketId: string) {
    e.preventDefault();
    const numericId = getTicketTypeNumericId(ticketId);
    if (Number.isNaN(numericId)) return;

    setPromoError(null);
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
        await createManagerTicketPromotion(numericId, payload);
      }
      cancelEditPromotion();
      showSuccess(editingPromoId != null ? "Promotion updated." : "Promotion created.");
      await loadPromotions(ticketId);
    } catch (err) {
      setPromoError(getDisplayError(err, editingPromoId != null ? "Could not update promotion." : "Could not create promotion."));
    } finally {
      setPromoSubmitting(false);
    }
  }

  async function handleDeletePromotion(ticketId: string, promotionId: number, promotionName: string) {
    if (!confirm(`Are you sure you want to delete the promotion "${promotionName}"?`)) {
      return;
    }

    try {
      await deleteManagerTicketPromotion(promotionId);
      // Reset the edit form if the promotion being edited was just deleted
      if (editingPromoId === promotionId) {
        cancelEditPromotion();
      }
      showSuccess("Promotion deleted.");
      await loadPromotions(ticketId);
    } catch (err) {
      setError(getDisplayError(err, "Could not delete promotion."));
    }
  }

  async function handleTogglePromotion(ticketId: string, promotionId: number, currentActive: boolean) {
    try {
      await toggleManagerTicketPromotion(promotionId, !currentActive);
      showSuccess(currentActive ? "Promotion deactivated." : "Promotion activated.");
      await loadPromotions(ticketId);
    } catch (err) {
      setError(getDisplayError(err, "Could not change promotion status."));
    }
  }

  async function handleViewDetail(promotionId: number) {
    setLoadingDetailPromoId(promotionId);
    try {
      const detail = await getManagerTicketPromotionDetail(promotionId);
      setViewingPromo(detail);
    } catch (err) {
      setError(getDisplayError(err, "Could not load promotion details."));
    } finally {
      setLoadingDetailPromoId(null);
    }
  }

  return (
    <div className="space-y-6 px-8 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm" style={{ fontFamily: cinzel, color: T.muted }}>
          <span className="font-semibold" style={{ color: T.text }}>
            {tickets.length}
          </span>
          {` ticket types`}
          {museumName ? (
            <span style={{ color: T.mutedLight }}>{` · ${museumName}`}</span>
          ) : null}
        </p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          disabled={!canCreate}
          className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{
            background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
            color: T.surface,
          }}
        >
          <Plus className="h-4 w-4" />
          {showForm ? "Close form" : "Create ticket type"}
        </button>
      </div>

      {!canCreate && (
        <p
          className="rounded-2xl px-4 py-3 text-sm"
          style={{ background: "rgba(200,155,69,0.10)", color: T.muted }}
        >
          A museum profile is required before adding ticket types.
        </p>
      )}

      {showForm && canCreate && (
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl p-6"
          style={{ background: T.surface, border: `1px solid ${T.border}` }}
        >
          <h2 className="mb-4 text-lg font-semibold" style={{ fontFamily: cinzel, color: T.text }}>
            New ticket type
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-sm" style={{ color: T.muted }}>Name (VI) *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Vé người lớn"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm" style={{ color: T.muted }}>Name (EN)</label>
              <input
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="Adult ticket"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm" style={{ color: T.muted }}>Price (VND) *</label>
              <input
                type="number" min="0" step="1000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="50000"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm" style={{ color: T.muted }}>Exhibition (optional)</label>
              <select
                value={exhibitionId}
                onChange={(e) => setExhibitionId(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
              >
                <option value="">Whole museum (All exhibitions)</option>
                {exhibitions.map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.name || `Exhibition #${ex.id}`}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm" style={{ color: T.muted }}>Description (VI)</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm" style={{ color: T.muted }}>Description (EN)</label>
              <input
                value={descriptionEn}
                onChange={(e) => setDescriptionEn(e.target.value)}
                placeholder="Optional English description"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
              />
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-xl px-3 py-2 text-sm" style={{ background: "rgba(180,40,40,0.08)", color: "#8B2E2E" }}>
              {error}
            </p>
          )}

          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl px-6 py-2 text-sm font-medium disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`, color: T.surface }}
            >
              {isSubmitting ? "Saving…" : "Create ticket type"}
            </button>
          </div>
        </form>
      )}

      <SuccessBanner message={success} />
      {error && (
        <p className="rounded-xl px-3 py-2 text-sm" style={{ background: "rgba(180,40,40,0.08)", color: "#8B2E2E" }}>
          {error}
        </p>
      )}

      <div
        className="overflow-hidden rounded-3xl"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        {tickets.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm" style={{ color: T.muted }}>No ticket types yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}`, background: "rgba(245,230,200,0.35)" }}>
                  <th className="px-5 py-4 font-medium" style={{ color: T.mutedLight }}>ID</th>
                  <th className="px-5 py-4 font-medium" style={{ color: T.mutedLight }}>Type</th>
                  <th className="px-5 py-4 font-medium" style={{ color: T.mutedLight }}>Price</th>
                  <th className="px-5 py-4 font-medium" style={{ color: T.mutedLight }}>Status</th>
                  <th className="px-5 py-4 font-medium" style={{ color: T.mutedLight }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} style={{ borderBottom: `1px solid ${T.border}` }} className="hover:bg-[rgba(200,155,69,0.05)]">
                    <td className="px-5 py-4" style={{ color: T.text }}>{ticket.id}</td>
                    <td className="px-5 py-4" style={{ color: T.text }}>{ticket.type}</td>
                    <td className="px-5 py-4" style={{ color: T.muted }}>{ticket.price}</td>
                    <td className="px-5 py-4">
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          background: ticket.status === "Active" ? "rgba(79,125,74,0.12)" : "rgba(200,155,69,0.15)",
                          color: ticket.status === "Active" ? T.success : T.primaryDark,
                        }}
                      >
                        {labelStatus(ticket.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {ticket.status === "Pending" && (
                          <button
                            type="button"
                            onClick={() => handlePublish(ticket.id)}
                            disabled={isPublishing[ticket.id]}
                            className="rounded-xl px-3 py-1 text-xs font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                            style={{ background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`, color: T.surface }}
                          >
                            {isPublishing[ticket.id] ? "Publishing…" : "Publish"}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => router.push(`/museum-manager/ticket-application/${ticket.id.replace("TK-", "")}`)}
                          className="inline-flex items-center gap-1 rounded-xl px-3 py-1 text-xs font-medium transition-opacity hover:opacity-90"
                          style={{
                            border: "1px solid rgba(79,70,229,0.20)",
                            background: "rgba(79,70,229,0.08)",
                            color: "#4F46E5",
                          }}
                        >
                          <Eye className="h-3 w-3" />
                          Detail
                        </button>
                        <button
                          type="button"
                          onClick={() => router.push(`/museum-manager/ticket-application/${ticket.id.replace("TK-", "")}?edit=true`)}
                          className="inline-flex items-center gap-1 rounded-xl px-3 py-1 text-xs font-medium transition-opacity hover:opacity-90"
                          style={{
                            border: `1px solid ${T.border}`,
                            background: T.bg,
                            color: T.text,
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTicket(ticket.id)}
                          className="inline-flex items-center gap-1 rounded-xl px-3 py-1 text-xs font-medium transition-opacity hover:opacity-90 text-red-600 hover:bg-red-50"
                          style={{
                            border: "1px solid rgba(220,38,38,0.20)",
                            background: "rgba(220,38,38,0.08)",
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (promoFormTarget === ticket.id) {
                              setPromoFormTarget(null);
                              cancelEditPromotion();
                            } else {
                              setPromoFormTarget(ticket.id);
                              cancelEditPromotion();
                              loadPromotions(ticket.id);
                            }
                          }}
                          className="inline-flex items-center gap-1 rounded-xl px-3 py-1 text-xs font-medium transition-opacity hover:opacity-90"
                          style={{
                            background: promoFormTarget === ticket.id ? "rgba(220,38,38,0.15)" : "rgba(220,38,38,0.08)",
                            border: "1px solid rgba(220,38,38,0.20)",
                            color: "#B91C1C",
                          }}
                        >
                          <Tag className="h-3 w-3" />
                          {promoFormTarget === ticket.id ? "Close" : "Promotions"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ═══ Promotion Panel ═══ */}
            {promoFormTarget && (() => {
              const ticket = tickets.find(t => t.id === promoFormTarget);
              if (!ticket) return null;
              const promos = promotionsByTicket[ticket.id] ?? [];
              const isLoading = loadingPromos[ticket.id];

              return (
                <div className="mx-5 mb-5 rounded-2xl p-5 space-y-4" style={{ background: "rgba(220,38,38,0.03)", border: "1px solid rgba(220,38,38,0.15)" }}>
                  <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: T.text }}>
                    <Tag className="h-4 w-4" style={{ color: "#B91C1C" }} />
                    Promotions for &quot;{ticket.type}&quot;
                  </h3>

                  {isLoading ? (
                    <p className="text-xs" style={{ color: T.muted }}>Loading promotions...</p>
                  ) : promos.length === 0 ? (
                    <p className="text-xs" style={{ color: T.muted }}>No promotions yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {promos.map((promo) => {
                        const now = new Date();
                        const start = new Date(promo.startDate);
                        const end = new Date(promo.endDate);
                        const isCurrentlyActive = promo.isActive && start <= now && end >= now;
                        const isExpired = end < now;

                        return (
                          <div
                            key={promo.id}
                            className="flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-xs"
                            style={{
                              background: isCurrentlyActive ? "rgba(79,125,74,0.08)" : "rgba(200,155,69,0.06)",
                              border: `1px solid ${isCurrentlyActive ? "rgba(79,125,74,0.20)" : T.border}`,
                            }}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold" style={{ color: T.text }}>{promo.name}</span>
                                <span
                                  className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                                  style={{
                                    background: isCurrentlyActive ? "rgba(79,125,74,0.15)" : isExpired ? "rgba(139,58,58,0.10)" : "rgba(200,155,69,0.15)",
                                    color: isCurrentlyActive ? T.success : isExpired ? "#8B3A3A" : T.primaryDark,
                                  }}
                                >
                                  {isCurrentlyActive ? `🟢 ${labelStatus("Active")}` : isExpired ? `⏰ ${labelStatus("Expired")}` : promo.isActive ? `⏳ ${labelStatus("Scheduled")}` : `⏸ ${labelStatus("Paused")}`}
                                </span>
                              </div>
                              <p className="mt-0.5" style={{ color: T.muted }}>
                                {promo.discountType === "Percentage" ? `${promo.discountValue}% off` : `${promo.discountValue.toLocaleString()} VND off`}
                                {" · "}
                                {start.toLocaleDateString("en-US")} → {end.toLocaleDateString("en-US")}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleViewDetail(promo.id)}
                                className="rounded-lg p-1.5 transition-opacity hover:opacity-70 text-indigo-600 hover:bg-indigo-50"
                                title="View details"
                                disabled={loadingDetailPromoId === promo.id}
                              >
                                {loadingDetailPromoId === promo.id ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border border-indigo-600 border-t-transparent" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => startEditPromotion(promo)}
                                className="rounded-lg p-1.5 transition-opacity hover:opacity-70 text-blue-600 hover:bg-blue-50"
                                title="Edit"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePromotion(ticket.id, promo.id, promo.name)}
                                className="rounded-lg p-1.5 transition-opacity hover:opacity-70 text-red-600 hover:bg-red-50"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleTogglePromotion(ticket.id, promo.id, promo.isActive)}
                                className="rounded-lg p-1.5 transition-opacity hover:opacity-70"
                                title={promo.isActive ? "Turn off" : "Turn on"}
                                style={{ color: promo.isActive ? T.success : T.muted }}
                              >
                                {promo.isActive ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Create / Update promotion form */}
                  <form onSubmit={(e) => handleCreateOrUpdatePromotion(e, ticket.id)} className="space-y-3 pt-2 border-t" style={{ borderColor: T.border }}>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "#B91C1C" }}>
                        {editingPromoId != null ? "Edit promotion" : "Add new promotion"}
                      </h4>
                      {editingPromoId != null && (
                        <button
                          type="button"
                          onClick={cancelEditPromotion}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-500 hover:text-stone-700 bg-stone-100 rounded-md px-1.5 py-0.5"
                        >
                          <X className="h-3 w-3" /> Cancel edit
                        </button>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="block text-xs" style={{ color: T.muted }}>Promotion name *</label>
                        <input
                          value={promoName}
                          onChange={(e) => setPromoName(e.target.value)}
                          placeholder="National Day 2/9 discount"
                          required
                          className="w-full rounded-lg px-3 py-2 text-xs outline-none"
                          style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs" style={{ color: T.muted }}>Discount type *</label>
                        <select
                          value={promoDiscountType}
                          onChange={(e) => setPromoDiscountType(e.target.value as "Percentage" | "FixedAmount")}
                          className="w-full rounded-lg px-3 py-2 text-xs outline-none"
                          style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                        >
                          <option value="Percentage">Percentage</option>
                          <option value="FixedAmount">FixedAmount</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs" style={{ color: T.muted }}>
                          Discount value * {promoDiscountType === "Percentage" ? "(0–100%)" : "(VND)"}
                        </label>
                        <input
                          type="number" min="0"
                          max={promoDiscountType === "Percentage" ? "100" : undefined}
                          step={promoDiscountType === "Percentage" ? "1" : "1000"}
                          value={promoDiscountValue}
                          onChange={(e) => setPromoDiscountValue(e.target.value)}
                          placeholder={promoDiscountType === "Percentage" ? "20" : "10000"}
                          required
                          className="w-full rounded-lg px-3 py-2 text-xs outline-none"
                          style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs" style={{ color: T.muted }}>Description</label>
                        <input
                          value={promoDescription}
                          onChange={(e) => setPromoDescription(e.target.value)}
                          placeholder="For National Day 2/9"
                          className="w-full rounded-lg px-3 py-2 text-xs outline-none"
                          style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs" style={{ color: T.muted }}>Start date *</label>
                        <input
                          type="date" value={promoStartDate}
                          onChange={(e) => setPromoStartDate(e.target.value)}
                          required
                          className="w-full rounded-lg px-3 py-2 text-xs outline-none"
                          style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs" style={{ color: T.muted }}>End date *</label>
                        <input
                          type="date" value={promoEndDate}
                          onChange={(e) => setPromoEndDate(e.target.value)}
                          required
                          className="w-full rounded-lg px-3 py-2 text-xs outline-none"
                          style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                        />
                      </div>
                    </div>

                    {promoError && (
                      <p className="rounded-lg px-3 py-1.5 text-xs" style={{ background: "rgba(180,40,40,0.08)", color: "#8B2E2E" }}>
                        {promoError}
                      </p>
                    )}

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={promoSubmitting}
                        className="rounded-lg px-5 py-1.5 text-xs font-medium disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)", color: "#FFF" }}
                      >
                        {promoSubmitting ? "Saving…" : (editingPromoId != null ? "Save changes" : "Create promotion")}
                      </button>
                    </div>
                  </form>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* ═══ Promotion Detail Modal ═══ */}
      {viewingPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-lg overflow-hidden rounded-3xl p-6 space-y-4 shadow-2xl transition-transform"
            style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
            }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: T.border }}>
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: cinzel, color: T.text }}>
                <Tag className="h-5 w-5" style={{ color: "#B91C1C" }} />
                Promotion details
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
                <span className="block text-xs font-semibold uppercase tracking-wider" style={{ color: T.muted }}>Name</span>
                <span className="text-base font-semibold" style={{ color: T.text }}>{viewingPromo.name}</span>
              </div>

              {viewingPromo.nameEn && (
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider" style={{ color: T.muted }}>English name</span>
                  <span className="text-base" style={{ color: T.text }}>{viewingPromo.nameEn}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider" style={{ color: T.muted }}>Discount value</span>
                  <span className="text-base font-bold text-red-600">
                    {viewingPromo.discountType === "Percentage"
                      ? `${viewingPromo.discountValue}%`
                      : `${viewingPromo.discountValue.toLocaleString()} VND`}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider" style={{ color: T.muted }}>Type</span>
                  <span className="text-base" style={{ color: T.text }}>
                    {viewingPromo.discountType}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider" style={{ color: T.muted }}>Start date</span>
                  <span className="text-base" style={{ color: T.text }}>
                    {new Date(viewingPromo.startDate).toLocaleDateString("en-US")}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider" style={{ color: T.muted }}>End date</span>
                  <span className="text-base" style={{ color: T.text }}>
                    {new Date(viewingPromo.endDate).toLocaleDateString("en-US")}
                  </span>
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider" style={{ color: T.muted }}>Description</span>
                <p className="mt-0.5 leading-relaxed" style={{ color: T.text }}>
                  {viewingPromo.description || <span className="italic" style={{ color: T.mutedLight }}>No description</span>}
                </p>
              </div>

              {viewingPromo.descriptionEn && (
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider" style={{ color: T.muted }}>English description</span>
                  <p className="mt-0.5 leading-relaxed" style={{ color: T.text }}>{viewingPromo.descriptionEn}</p>
                </div>
              )}

              <div className="border-t pt-3 flex items-center justify-between" style={{ borderColor: T.border }}>
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider" style={{ color: T.muted }}>Status</span>
                  <span
                    className="mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold"
                    style={{
                      background: viewingPromo.isActive ? "rgba(79,125,74,0.12)" : "rgba(139,58,58,0.10)",
                      color: viewingPromo.isActive ? T.success : "#8B3A3A",
                    }}
                  >
                    {viewingPromo.isActive ? `🟢 ${labelStatus("Active")}` : `⏸ ${labelStatus("Paused")}`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingPromo(null)}
                  className="rounded-xl px-5 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
                  style={{
                    background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
                    color: T.surface,
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
