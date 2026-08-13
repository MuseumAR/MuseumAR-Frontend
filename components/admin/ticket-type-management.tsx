"use client";

import { useState, useEffect } from "react";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import { labelStatus } from "@/lib/status-labels";
import type { TicketTypeDto, TicketPromotionDto } from "@/types/api";
import { Tag, Eye, X } from "lucide-react";
import {
  getManagerTicketPromotions,
  getManagerTicketPromotionDetail,
} from "@/services/museum-manager/ticket-api.service";

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(price);
}

export function TicketTypeManagementPanel({
  ticketTypes,
  museumId,
  museumName,
}: {
  ticketTypes: TicketTypeDto[];
  museumId: number | null;
  museumName?: string | null;
}) {
  const [promoPanelTarget, setPromoPanelTarget] = useState<number | null>(null);
  const [promotions, setPromotions] = useState<TicketPromotionDto[]>([]);
  const [loadingPromos, setLoadingPromos] = useState(false);
  const [viewingPromoDetail, setViewingPromoDetail] = useState<TicketPromotionDto | null>(null);
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadPromotions(ticketTypeId: number) {
    setLoadingPromos(true);
    setError(null);
    try {
      const data = await getManagerTicketPromotions(ticketTypeId);
      setPromotions(data);
    } catch {
      setError("Unable to load promotions.");
    } finally {
      setLoadingPromos(false);
    }
  }

  async function handleViewDetail(promotionId: number) {
    setLoadingDetailId(promotionId);
    try {
      const detail = await getManagerTicketPromotionDetail(promotionId);
      setViewingPromoDetail(detail);
    } catch {
      setError("Unable to load promotion details.");
    } finally {
      setLoadingDetailId(null);
    }
  }

  return (
    <div className="space-y-6 px-8 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm" style={{ fontFamily: cinzel, color: T.muted }}>
          <span className="font-semibold" style={{ color: T.text }}>
            {ticketTypes.length}
          </span>
          {` ticket types`}
          {museumName ? (
            <span style={{ color: T.mutedLight }}>{` · ${museumName}`}</span>
          ) : null}
        </p>
      </div>

      {error && (
        <p className="rounded-xl px-3 py-2 text-sm" style={{ background: "rgba(180,40,40,0.08)", color: "#8B2E2E" }}>
          {error}
        </p>
      )}

      <div
        className="overflow-hidden rounded-3xl"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        {ticketTypes.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm" style={{ color: T.muted }}>
              No ticket types yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr
                  style={{
                    borderBottom: `1px solid ${T.border}`,
                    background: "rgba(245,230,200,0.35)",
                  }}
                >
                  {["ID", "Name", "Price", "Exhibition ID", "Description", "Status", "Actions"].map((label) => (
                    <th
                      key={label}
                      className="px-5 py-4 font-medium"
                      style={{ color: T.mutedLight }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ticketTypes.map((ticket) => {
                  const isPromoOpen = promoPanelTarget === ticket.id;
                  return (
                    <tr
                      key={ticket.id}
                      style={{ borderBottom: `1px solid ${T.border}` }}
                      className="hover:bg-[rgba(200,155,69,0.05)]"
                    >
                      <td className="px-5 py-4 tabular-nums" style={{ color: T.text }}>
                        {ticket.id}
                      </td>
                      <td className="px-5 py-4 font-medium" style={{ color: T.text }}>
                        {ticket.name}
                      </td>
                      <td className="px-5 py-4 tabular-nums" style={{ color: T.text }}>
                        {formatPrice(ticket.price)}
                      </td>
                      <td className="px-5 py-4" style={{ color: T.muted }}>
                        {ticket.exhibitionId ?? "—"}
                      </td>
                      <td className="max-w-[200px] truncate px-5 py-4" style={{ color: T.muted }}>
                        {ticket.description ?? "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{
                            background:
                              ticket.status === "Approved"
                                ? "rgba(79,125,74,0.12)"
                                : "rgba(200,155,69,0.15)",
                            color: ticket.status === "Approved" ? T.success : T.primaryDark,
                          }}
                        >
                          {labelStatus(ticket.status)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => {
                            if (isPromoOpen) {
                              setPromoPanelTarget(null);
                              setPromotions([]);
                            } else {
                              setPromoPanelTarget(ticket.id);
                              loadPromotions(ticket.id);
                            }
                          }}
                          className="inline-flex items-center gap-1 rounded-xl px-3 py-1 text-xs font-medium transition-opacity hover:opacity-90"
                          style={{
                            background: isPromoOpen ? "rgba(220,38,38,0.15)" : "rgba(220,38,38,0.08)",
                            border: "1px solid rgba(220,38,38,0.20)",
                            color: "#B91C1C",
                          }}
                        >
                          <Tag className="h-3 w-3" />
                          {isPromoOpen ? "Close" : "Promotions"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* ═══ Admin View-Only Promotion Panel ═══ */}
            {promoPanelTarget && (() => {
              const ticket = ticketTypes.find(t => t.id === promoPanelTarget);
              if (!ticket) return null;

              return (
                <div className="mx-5 mb-5 mt-3 rounded-2xl p-5 space-y-4" style={{ background: "rgba(220,38,38,0.03)", border: "1px solid rgba(220,38,38,0.15)" }}>
                  <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: T.text }}>
                    <Tag className="h-4 w-4" style={{ color: "#B91C1C" }} />
                    Promotions for &quot;{ticket.name}&quot; (View only)
                  </h3>

                  {loadingPromos ? (
                    <p className="text-xs animate-pulse" style={{ color: T.muted }}>Loading promotions…</p>
                  ) : promotions.length === 0 ? (
                    <p className="text-xs" style={{ color: T.muted }}>No promotions yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {promotions.map((promo) => {
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
                                  {isCurrentlyActive ? "🟢 Active" : isExpired ? "⏰ Expired" : promo.isActive ? "⏳ Scheduled" : "⏸ Paused"}
                                </span>
                              </div>
                              <p className="mt-0.5" style={{ color: T.muted }}>
                                {promo.discountType === "Percentage" ? `${promo.discountValue}% off` : `${promo.discountValue.toLocaleString()} VND off`}
                                {" · "}
                                {start.toLocaleDateString("vi-VN")} → {end.toLocaleDateString("vi-VN")}
                              </p>
                            </div>
                            <div className="flex items-center shrink-0">
                              <button
                                type="button"
                                onClick={() => handleViewDetail(promo.id)}
                                className="rounded-lg p-1.5 transition-opacity hover:opacity-70 text-indigo-600 hover:bg-indigo-50"
                                title="View details"
                                disabled={loadingDetailId === promo.id}
                              >
                                {loadingDetailId === promo.id ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border border-indigo-600 border-t-transparent" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* ═══ View-Only Promotion Detail Modal ═══ */}
      {viewingPromoDetail && (
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
                Promotion details (Admin)
              </h3>
              <button
                type="button"
                onClick={() => setViewingPromoDetail(null)}
                className="rounded-full p-1.5 hover:bg-stone-100 transition-colors"
                style={{ color: T.muted }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-sm">
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider" style={{ color: T.muted }}>Name</span>
                <span className="text-base font-semibold" style={{ color: T.text }}>{viewingPromoDetail.name}</span>
              </div>

              {viewingPromoDetail.nameEn && (
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider" style={{ color: T.muted }}>English name</span>
                  <span className="text-base" style={{ color: T.text }}>{viewingPromoDetail.nameEn}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider" style={{ color: T.muted }}>Discount value</span>
                  <span className="text-base font-bold text-red-600">
                    {viewingPromoDetail.discountType === "Percentage"
                      ? `${viewingPromoDetail.discountValue}%`
                      : `${viewingPromoDetail.discountValue.toLocaleString()} VND`}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider" style={{ color: T.muted }}>Type</span>
                  <span className="text-base" style={{ color: T.text }}>
                    {viewingPromoDetail.discountType}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider" style={{ color: T.muted }}>Start date</span>
                  <span className="text-base" style={{ color: T.text }}>
                    {new Date(viewingPromoDetail.startDate).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider" style={{ color: T.muted }}>End date</span>
                  <span className="text-base" style={{ color: T.text }}>
                    {new Date(viewingPromoDetail.endDate).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider" style={{ color: T.muted }}>Description</span>
                <p className="mt-0.5 leading-relaxed" style={{ color: T.text }}>
                  {viewingPromoDetail.description || <span className="italic" style={{ color: T.mutedLight }}>No description yet</span>}
                </p>
              </div>

              {viewingPromoDetail.descriptionEn && (
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider" style={{ color: T.muted }}>English description</span>
                  <p className="mt-0.5 leading-relaxed" style={{ color: T.text }}>{viewingPromoDetail.descriptionEn}</p>
                </div>
              )}

              <div className="border-t pt-3 flex items-center justify-between" style={{ borderColor: T.border }}>
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider" style={{ color: T.muted }}>Status</span>
                  <span
                    className="mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold"
                    style={{
                      background: viewingPromoDetail.isActive ? "rgba(79,125,74,0.12)" : "rgba(139,58,58,0.10)",
                      color: viewingPromoDetail.isActive ? T.success : "#8B3A3A",
                    }}
                  >
                    {viewingPromoDetail.isActive ? "🟢 Active" : "⏸ Paused"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingPromoDetail(null)}
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
