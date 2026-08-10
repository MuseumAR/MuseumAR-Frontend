"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Minus,
  Plus,
  QrCode,
  ShieldCheck,
  Ticket,
  X,
  Tag,
} from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { useAuth } from "@/context/auth-context";
import { useLanguage } from "@/context/language-context";
import { formatVnd } from "@/lib/format";
import { getDisplayError } from "@/lib/validation";
import {
  cancelTicketOrder,
  confirmTicketPayment,
  getPendingOrder,
  listPublicTicketTypes,
  placeTicketOrder,
} from "@/services/visitor/ticketing.service";
import { checkPaymentStatus } from "@/services/visitor/ticketing-api.service";
import type { CreateOrderResponseDto, PendingOrderDto, TicketTypeDto } from "@/types/api";

const C = {
  bg: "#F5E6C8",
  surface: "#FFF8E7",
  primary: "#C89B3C",
  secondary: "#A67C2D",
  text: "#2B1D0E",
  muted: "#7D5A3C",
  mutedLight: "#A08060",
  border: "rgba(200,155,60,0.30)",
};

const MAX_QTY = 10;

type PendingOrder = {
  ticketType?: TicketTypeDto;
  ticketTypeName?: string;
  quantity: number;
  orderCode: string;
  checkoutUrl?: string | null;
  qrCode?: string | null;
  amount: number;
};

function formatTimer(secs: number) {
  if (secs <= 0) return "00:00";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function TicketShop() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const [types, setTypes] = useState<TicketTypeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [buyingId, setBuyingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Checkout modal states (Pre-checkout)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutTarget, setCheckoutTarget] = useState<TicketTypeDto | null>(null);
  const [selectedPromoId, setSelectedPromoId] = useState<number | null>(null);
  const [checkoutQty, setCheckoutQty] = useState<number>(1);

  // Active payment modal state (Shopee retention flow)
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load active pending order on mount
  useEffect(() => {
    if (!isAuthenticated) return;

    (async () => {
      try {
        const pending: PendingOrderDto | null = await getPendingOrder();
        if (pending && pending.remainingSeconds > 0) {
          setPendingOrder({
            ticketTypeName: pending.ticketTypeName,
            quantity: pending.quantity,
            orderCode: pending.orderCode,
            checkoutUrl: pending.checkoutUrl,
            qrCode: pending.qrCode,
            amount: pending.totalAmount,
          });
          setRemainingSeconds(pending.remainingSeconds);
          setIsModalOpen(true);
        }
      } catch {
        // Silently ignore if no pending order
      }
    })();
  }, [isAuthenticated]);

  // Countdown timer effect
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (pendingOrder && remainingSeconds > 0) {
      timerRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            if (pendingOrder?.orderCode) {
              cancelTicketOrder(pendingOrder.orderCode).catch(() => {});
            }
            setPendingOrder(null);
            setIsModalOpen(false);
            setError("Đơn hàng của bạn đã quá thời gian chờ (15 phút) và bị tự động hủy.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [pendingOrder, remainingSeconds]);

  // Auto-polling payment status every 3 seconds while payment modal is open
  useEffect(() => {
    if (!pendingOrder || !isModalOpen) return;

    const intervalId = setInterval(async () => {
      try {
        const res = await checkPaymentStatus(pendingOrder.orderCode);
        if (res?.isPaid) {
          clearInterval(intervalId);
          setSuccess(`Thanh toán thành công đơn hàng #${pendingOrder.orderCode}!`);
          setPendingOrder(null);
          setIsModalOpen(false);
          router.push("/tickets/mine?purchased=1");
        } else if (res?.isCancelled) {
          clearInterval(intervalId);
          setError(`Đơn hàng #${pendingOrder.orderCode} đã bị hủy.`);
          setPendingOrder(null);
          setIsModalOpen(false);
        }
      } catch {
        // Silently ignore polling errors during auto-check
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [pendingOrder, isModalOpen, router, t]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await listPublicTicketTypes(language);
        if (cancelled) return;
        setTypes(list);
        setQuantities(
          Object.fromEntries(list.map((t) => [t.id, 1])) as Record<number, number>,
        );
      } catch (err) {
        if (!cancelled) {
          setError(getDisplayError(err, t("tickets.error_load")));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [language, t]);

  function setQty(id: number, next: number) {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.min(MAX_QTY, Math.max(1, next)),
    }));
  }

  async function handleInitiateOrder(ticketType: TicketTypeDto, quantity: number, promoId: number | null) {
    setError(null);
    setSuccess(null);
    setModalError(null);

    if (authLoading) return;

    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent("/tickets")}`);
      return;
    }

    setBuyingId(ticketType.id);

    try {
      // Send request to backend API POST /api/ticketing/create-order
      const res: CreateOrderResponseDto = await placeTicketOrder({
        ticketTypeId: ticketType.id,
        quantity,
        promotionId: promoId,
      });

      const promo = ticketType.activePromotions?.find(p => p.id === promoId);
      let unitPrice = ticketType.price;
      if (promo) {
        const discount = promo.discountType === "Percentage"
          ? ticketType.price * promo.discountValue / 100
          : promo.discountValue;
        unitPrice = Math.max(0, ticketType.price - discount);
      }
      const totalAmount = res.amount ?? unitPrice * quantity;

      // Open payment modal with order details & QR link
      setPendingOrder({
        ticketType,
        ticketTypeName: ticketType.name,
        quantity,
        orderCode: res.orderCode,
        checkoutUrl: res.checkoutUrl,
        qrCode: res.qrCode,
        amount: totalAmount,
      });
      setRemainingSeconds(900); // 15 minutes
      setIsModalOpen(true);
      setIsCheckoutOpen(false); // Close checkout modal
      setCheckoutTarget(null);
    } catch (err) {
      setError(
        getDisplayError(err, t("tickets.error_init")),
      );
    } finally {
      setBuyingId(null);
    }
  }

  async function handleConfirmPayment() {
    if (!pendingOrder) return;

    setConfirming(true);
    setModalError(null);

    try {
      // Confirm payment on backend
      await confirmTicketPayment(pendingOrder.orderCode);
      setSuccess(t("tickets.payment_success", { code: pendingOrder.orderCode }));
      setPendingOrder(null);
      setIsModalOpen(false);
      router.push("/tickets/mine?purchased=1");
    } catch (err) {
      setModalError(
        getDisplayError(
          err,
          t("tickets.error_confirm"),
        ),
      );
    } finally {
      setConfirming(false);
    }
  }

  // EXPLICIT CANCEL ORDER FUNCTION (Only when user explicitly clicks "Hủy đơn hàng này")
  async function handleCancelOrder() {
    if (!pendingOrder) return;

    setCancelling(true);
    setModalError(null);

    try {
      await cancelTicketOrder(pendingOrder.orderCode);
      setError(t("tickets.order_cancelled", { code: pendingOrder.orderCode }));
      setPendingOrder(null);
      setIsModalOpen(false);
    } catch (err) {
      setModalError(
        getDisplayError(err, t("tickets.error_cancel")),
      );
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 pb-20 pt-28 sm:px-8">
        <header className="mb-10">
          <p
            className="mb-2 text-xs font-medium uppercase tracking-[0.2em]"
            style={{ color: C.primary }}
          >
            {t("tickets.tagline")}
          </p>
          <h1
            className="text-3xl font-semibold tracking-tight sm:text-4xl"
            style={{ color: C.text }}
          >
            {t("tickets.title")}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed" style={{ color: C.muted }}>
            {t("tickets.subtitle")}
          </p>
          <div className="mt-5">
            <Link
              href="/tickets/mine"
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-opacity hover:opacity-85"
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                color: C.text,
              }}
            >
              <Ticket className="h-4 w-4" style={{ color: C.primary }} />
              {t("tickets.my_tickets_btn")}
            </Link>
          </div>
        </header>

        {/* SHOPEE-STYLE PENDING ORDER BANNER */}
        {pendingOrder && remainingSeconds > 0 && !isModalOpen && (
          <div
            className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl p-4 shadow-sm border"
            style={{ background: "#FFFBEB", borderColor: "#FCD34D" }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700 shrink-0">
                <Clock className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-900">
                  Bạn có 1 đơn hàng chờ thanh toán (#{pendingOrder.orderCode})
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Thời gian còn lại:{" "}
                  <span className="font-mono font-bold text-amber-800">
                    {formatTimer(remainingSeconds)}
                  </span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90 shadow-sm shrink-0"
              style={{ background: "#D97706" }}
            >
              Tiếp tục thanh toán
            </button>
          </div>
        )}

        {error && (
          <div
            className="mb-6 rounded-2xl px-4 py-3 text-sm"
            style={{
              background: "rgba(139,58,58,0.08)",
              border: "1px solid rgba(139,58,58,0.25)",
              color: "#8B3A3A",
            }}
            role="alert"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="mb-6 rounded-2xl px-4 py-3 text-sm flex items-center gap-2"
            style={{
              background: "rgba(60,120,80,0.10)",
              border: "1px solid rgba(60,120,80,0.25)",
              color: "#2F5D3A",
            }}
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            {success}
          </div>
        )}

        {loading ? (
          <div
            className="flex items-center justify-center gap-2 rounded-3xl py-24 text-sm"
            style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.muted }}
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("tickets.loading_types")}
          </div>
        ) : types.length === 0 ? (
          <div
            className="rounded-3xl px-8 py-16 text-center text-sm"
            style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.muted }}
          >
            {t("tickets.no_types")}
          </div>
        ) : (
          <ul className="space-y-4">
            {types.map((ticket) => {
              const qty = quantities[ticket.id] ?? 1;
              const busy = buyingId === ticket.id;
              const hasPromos = ticket.activePromotions && ticket.activePromotions.length > 0;

              return (
                <li
                  key={ticket.id}
                  className="flex flex-col gap-4 rounded-3xl p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
                  style={{
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    boxShadow: "0 8px 28px rgba(43,29,14,0.06)",
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-semibold" style={{ color: C.text }}>
                        {ticket.name}
                      </h2>
                      {hasPromos && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold animate-bounce"
                          style={{
                            background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)",
                            color: "#FFF",
                            boxShadow: "0 2px 8px rgba(220,38,38,0.30)",
                          }}
                        >
                          🔥 Khuyến mãi
                        </span>
                      )}
                    </div>
                    {ticket.description ? (
                      <p className="mt-1 text-sm leading-relaxed" style={{ color: C.muted }}>
                        {ticket.description}
                      </p>
                    ) : null}

                    <p className="mt-4 text-xl font-semibold tabular-nums" style={{ color: C.secondary }}>
                      {formatVnd(ticket.price)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div
                      className="inline-flex items-center rounded-full"
                      style={{ border: `1px solid ${C.border}`, background: C.bg }}
                    >
                      <button
                        type="button"
                        aria-label={t("tickets.decrease")}
                        className="flex h-10 w-10 items-center justify-center rounded-full transition-opacity hover:opacity-70"
                        style={{ color: C.text }}
                        onClick={() => setQty(ticket.id, qty - 1)}
                        disabled={busy || qty <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span
                        className="min-w-[2rem] text-center text-sm font-medium tabular-nums"
                        style={{ color: C.text }}
                      >
                        {qty}
                      </span>
                      <button
                        type="button"
                        aria-label={t("tickets.increase")}
                        className="flex h-10 w-10 items-center justify-center rounded-full transition-opacity hover:opacity-70"
                        style={{ color: C.text }}
                        onClick={() => setQty(ticket.id, qty + 1)}
                        disabled={busy || qty >= MAX_QTY}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!isAuthenticated) {
                          router.push(`/login?next=${encodeURIComponent("/tickets")}`);
                          return;
                        }
                        setCheckoutTarget(ticket);
                        setSelectedPromoId(null);
                        setCheckoutQty(quantities[ticket.id] ?? 1);
                        setIsCheckoutOpen(true);
                      }}
                      disabled={busy}
                      className="inline-flex min-w-[8.5rem] items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
                      style={{
                        background: `linear-gradient(135deg, ${C.primary} 0%, ${C.secondary} 100%)`,
                        color: C.surface,
                        boxShadow: "0 2px 10px rgba(166,124,45,0.30)",
                      }}
                    >
                      {busy ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t("tickets.creating_order")}
                        </>
                      ) : isAuthenticated ? (
                        t("tickets.buy")
                      ) : (
                        t("tickets.login_to_buy")
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      {/* ═══ PRE-CHECKOUT PROMOTION SELECTION MODAL ═══ */}
      {isCheckoutOpen && checkoutTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => {
            setIsCheckoutOpen(false);
            setCheckoutTarget(null);
          }}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
            style={{ background: C.surface, border: `1px solid ${C.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: C.border }}>
              <div>
                <h3 className="text-lg font-bold" style={{ color: C.text }}>
                  Chọn khuyến mãi & Thanh toán
                </h3>
                <p className="text-xs" style={{ color: C.mutedLight }}>
                  Xác nhận thông tin mua vé và áp dụng mã ưu đãi
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCheckoutOpen(false);
                  setCheckoutTarget(null);
                }}
                className="rounded-full p-2 hover:bg-[rgba(200,155,60,0.15)] transition-colors"
                style={{ color: C.muted }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Ticket details & Quantity Controls */}
            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider block" style={{ color: C.mutedLight }}>Loại vé</span>
                <span className="text-base font-semibold block mt-0.5" style={{ color: C.text }}>{checkoutTarget.name}</span>
                {checkoutTarget.description && (
                  <p className="text-xs mt-1" style={{ color: C.muted }}>{checkoutTarget.description}</p>
                )}
              </div>

              {/* Adjust Qty directly in Checkout Modal */}
              <div className="flex items-center justify-between border-y py-3" style={{ borderColor: C.border }}>
                <span className="text-sm font-semibold" style={{ color: C.text }}>Số lượng vé mua</span>
                <div
                  className="inline-flex items-center rounded-full"
                  style={{ border: `1px solid ${C.border}`, background: C.bg }}
                >
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-full transition-opacity hover:opacity-70"
                    style={{ color: C.text }}
                    onClick={() => setCheckoutQty(prev => Math.max(1, prev - 1))}
                    disabled={checkoutQty <= 1}
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span
                    className="min-w-[1.5rem] text-center text-xs font-medium tabular-nums"
                    style={{ color: C.text }}
                  >
                    {checkoutQty}
                  </span>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-full transition-opacity hover:opacity-70"
                    style={{ color: C.text }}
                    onClick={() => setCheckoutQty(prev => Math.min(MAX_QTY, prev + 1))}
                    disabled={checkoutQty >= MAX_QTY}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Available Promotions Section */}
              {checkoutTarget.activePromotions && checkoutTarget.activePromotions.length > 0 ? (
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider block" style={{ color: C.mutedLight }}>
                    Khuyến mãi khả dụng
                  </span>
                  <div className="flex flex-col gap-2">
                    {/* Option: Original price (No promotion) */}
                    <label
                      className="flex items-center justify-between rounded-2xl p-3 text-xs border cursor-pointer transition-all"
                      style={{
                        borderColor: selectedPromoId === null ? C.primary : C.border,
                        background: selectedPromoId === null ? "rgba(200,155,60,0.06)" : "transparent",
                      }}
                      onClick={() => setSelectedPromoId(null)}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="checkout-promo"
                          checked={selectedPromoId === null}
                          onChange={() => setSelectedPromoId(null)}
                          className="accent-[#C89B3C]"
                        />
                        <span className="font-semibold" style={{ color: C.text }}>🏷️ Không áp dụng khuyến mãi</span>
                      </div>
                      <span style={{ color: C.muted }}>Giá gốc</span>
                    </label>

                    {/* Promotion options */}
                    {checkoutTarget.activePromotions.map((promo) => {
                      const isSelected = selectedPromoId === promo.id;
                      const discountText = promo.discountType === "Percentage"
                        ? `-${promo.discountValue}%`
                        : `-${formatVnd(promo.discountValue)}`;

                      return (
                        <label
                          key={promo.id}
                          className="flex items-center justify-between rounded-2xl p-3 text-xs border cursor-pointer transition-all"
                          style={{
                            borderColor: isSelected ? "#B91C1C" : C.border,
                            background: isSelected ? "rgba(220,38,38,0.04)" : "transparent",
                          }}
                          onClick={() => setSelectedPromoId(promo.id)}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="radio"
                              name="checkout-promo"
                              checked={isSelected}
                              onChange={() => setSelectedPromoId(promo.id)}
                              className="accent-[#B91C1C]"
                            />
                            <div className="min-w-0">
                              <span className="font-bold block truncate" style={{ color: C.text }}>🔥 {promo.name}</span>
                              {promo.description && (
                                <p className="text-[10px] text-stone-500 mt-0.5 truncate">{promo.description}</p>
                              )}
                            </div>
                          </div>
                          <span className="font-bold shrink-0 text-red-600" style={{ fontSize: "13px" }}>{discountText}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl p-3 text-xs text-center border border-dashed" style={{ borderColor: C.border, color: C.mutedLight }}>
                  Không có chương trình khuyến mãi khả dụng cho loại vé này.
                </div>
              )}
            </div>

            {/* Calculations & Total Payment */}
            {(() => {
              const promo = checkoutTarget.activePromotions?.find(p => p.id === selectedPromoId);
              let unitPrice = checkoutTarget.price;
              let discountVal = 0;

              if (promo) {
                discountVal = promo.discountType === "Percentage"
                  ? checkoutTarget.price * promo.discountValue / 100
                  : promo.discountValue;
                unitPrice = Math.max(0, checkoutTarget.price - discountVal);
              }

              const totalOriginal = checkoutTarget.price * checkoutQty;
              const totalDiscount = discountVal * checkoutQty;
              const totalPayment = unitPrice * checkoutQty;

              return (
                <div className="space-y-3 border-t pt-4" style={{ borderColor: C.border }}>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between" style={{ color: C.muted }}>
                      <span>Tổng tiền vé ({checkoutQty} vé)</span>
                      <span className="font-mono">{formatVnd(totalOriginal)}</span>
                    </div>
                    {totalDiscount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Giảm giá khuyến mãi</span>
                        <span className="font-mono">-{formatVnd(totalDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-2.5 mt-1.5" style={{ borderColor: C.border }}>
                      <span className="text-sm font-semibold" style={{ color: C.text }}>Tổng thanh toán</span>
                      <span className="text-lg font-bold" style={{ color: totalDiscount > 0 ? "#B91C1C" : C.secondary }}>
                        {formatVnd(totalPayment)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3.5 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCheckoutOpen(false);
                        setCheckoutTarget(null);
                      }}
                      className="flex-1 rounded-full py-2.5 text-xs font-semibold border transition-colors hover:bg-stone-50"
                      style={{ color: C.muted, borderColor: C.border }}
                    >
                      Quay lại
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInitiateOrder(checkoutTarget, checkoutQty, selectedPromoId)}
                      disabled={buyingId === checkoutTarget.id}
                      className="flex-1 rounded-full py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90 flex items-center justify-center gap-1.5 disabled:opacity-50"
                      style={{
                        background: selectedPromoId ? "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)" : `linear-gradient(135deg, ${C.primary} 0%, ${C.secondary} 100%)`,
                        boxShadow: selectedPromoId ? "0 2px 10px rgba(220,38,38,0.25)" : "0 2px 10px rgba(166,124,45,0.25)",
                      }}
                    >
                      {buyingId === checkoutTarget.id ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Đang tạo đơn...
                        </>
                      ) : (
                        "Tiến hành thanh toán"
                      )}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ═══ PAYMENT MODAL (PayOS QR) ═══ */}
      {pendingOrder && isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
            style={{ background: C.surface, border: `1px solid ${C.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: C.border }}>
              <div>
                <h3 className="text-lg font-bold" style={{ color: C.text }}>
                  {t("tickets.modal_title")}
                </h3>
                <p className="text-xs" style={{ color: C.mutedLight }}>
                  {t("tickets.order_code")}{" "}
                  <span className="font-mono font-semibold" style={{ color: C.secondary }}>
                    {pendingOrder.orderCode}
                  </span>
                </p>
              </div>
              {/* CLOSING MODAL ONLY HIDES MODAL (DOES NOT CANCEL ORDER) */}
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={cancelling || confirming}
                className="rounded-full p-2 hover:bg-[rgba(200,155,60,0.15)] transition-colors disabled:opacity-50"
                style={{ color: C.muted }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Countdown Warning Banner inside Modal */}
            {remainingSeconds > 0 && (
              <div className="flex items-center gap-2.5 rounded-xl p-3 text-xs bg-amber-50 border border-amber-200 text-amber-900">
                <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  Đơn hàng giữ trong{" "}
                  <strong className="font-mono text-amber-800 font-bold">{formatTimer(remainingSeconds)}</strong>. Đóng cửa sổ này sẽ không hủy đơn hàng.
                </span>
              </div>
            )}

            {/* Order summary */}
            <div
              className="rounded-2xl p-4 space-y-2 text-sm"
              style={{ background: "rgba(200,155,60,0.08)", border: `1px solid ${C.border}` }}
            >
              <div className="flex justify-between">
                <span style={{ color: C.muted }}>{t("tickets.ticket_type")}</span>
                <span className="font-semibold" style={{ color: C.text }}>{pendingOrder.ticketType?.name || pendingOrder.ticketTypeName}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: C.muted }}>{t("tickets.quantity")}</span>
                <span className="font-semibold" style={{ color: C.text }}>{pendingOrder.quantity} {t("tickets.tickets_count")}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2" style={{ borderColor: C.border }}>
                <span className="font-medium" style={{ color: C.text }}>{t("tickets.total_payment")}</span>
                <span className="text-lg font-bold" style={{ color: C.secondary }}>
                  {formatVnd(pendingOrder.amount)}
                </span>
              </div>
            </div>

            {/* QR Code section */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl border text-center space-y-3" style={{ borderColor: C.border, background: C.bg }}>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: C.primary }}>
                <QrCode className="h-4 w-4" /> {t("tickets.qr_header")}
              </div>

              {/* QR Image */}
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-stone-200">
                {(() => {
                  const qrCodeData =
                    pendingOrder.qrCode ||
                    pendingOrder.checkoutUrl ||
                    pendingOrder.orderCode;
                  const qrImageSrc =
                    pendingOrder.qrCode &&
                    (pendingOrder.qrCode.startsWith("http") ||
                      pendingOrder.qrCode.startsWith("data:image"))
                      ? pendingOrder.qrCode
                      : `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                          qrCodeData,
                        )}`;

                  return (
                    <img
                      src={qrImageSrc}
                      alt={t("tickets.qr_alt")}
                      className="w-48 h-48 object-contain mx-auto"
                    />
                  );
                })()}
              </div>

              <p className="text-xs max-w-xs" style={{ color: C.muted }}>
                {t("tickets.qr_instruction")}
              </p>
            </div>

            {/* PayOS External Link */}
            {pendingOrder.checkoutUrl && (
              <div className="text-center">
                <a
                  href={pendingOrder.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-medium underline transition-opacity hover:opacity-85"
                  style={{ color: C.secondary }}
                >
                  {t("tickets.open_payos")} <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            )}

            {modalError && (
              <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                {modalError}
              </p>
            )}

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {/* EXPLICIT CANCEL ORDER BUTTON */}
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={cancelling || confirming}
                className="flex-1 rounded-full border py-3 text-sm font-semibold transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                style={{ borderColor: C.border, color: C.muted }}
              >
                {cancelling ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang hủy...
                  </span>
                ) : (
                  "Hủy đơn hàng này"
                )}
              </button>

              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={confirming || cancelling}
                className="flex-1 rounded-full py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5"
                style={{
                  background: `linear-gradient(135deg, ${C.primary} 0%, ${C.secondary} 100%)`,
                  boxShadow: "0 2px 10px rgba(166,124,45,0.30)",
                }}
              >
                {confirming ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("tickets.checking_payment")}
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    {t("tickets.confirm_paid")}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
