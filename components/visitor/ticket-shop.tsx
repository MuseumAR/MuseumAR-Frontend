"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  Minus,
  Plus,
  QrCode,
  ShieldCheck,
  Ticket,
  X,
} from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { useAuth } from "@/context/auth-context";
import { formatVnd } from "@/lib/format";
import { getDisplayError } from "@/lib/validation";
import {
  cancelTicketOrder,
  confirmTicketPayment,
  listPublicTicketTypes,
  placeTicketOrder,
} from "@/services/visitor/ticketing.service";
import { checkPaymentStatus } from "@/services/visitor/ticketing-api.service";
import type { CreateOrderResponseDto, TicketTypeDto } from "@/types/api";

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
  ticketType: TicketTypeDto;
  quantity: number;
  orderCode: string;
  checkoutUrl?: string | null;
  qrCode?: string | null;
  amount: number;
};

export function TicketShop() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [types, setTypes] = useState<TicketTypeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [buyingId, setBuyingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Active payment modal state
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Auto-polling payment status every 3 seconds while payment modal is open
  useEffect(() => {
    if (!pendingOrder) return;

    const intervalId = setInterval(async () => {
      try {
        const res = await checkPaymentStatus(pendingOrder.orderCode);
        if (res?.isPaid) {
          clearInterval(intervalId);
          setSuccess(`Thanh toán thành công đơn hàng #${pendingOrder.orderCode}!`);
          setPendingOrder(null);
          router.push("/tickets/mine?purchased=1");
        } else if (res?.isCancelled) {
          clearInterval(intervalId);
          setError(`Đơn hàng #${pendingOrder.orderCode} đã bị hủy.`);
          setPendingOrder(null);
        }
      } catch {
        // Silently ignore polling errors during auto-check
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [pendingOrder, router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await listPublicTicketTypes();
        if (cancelled) return;
        setTypes(list);
        setQuantities(
          Object.fromEntries(list.map((t) => [t.id, 1])) as Record<number, number>,
        );
      } catch (err) {
        if (!cancelled) {
          setError(getDisplayError(err, "Không thể tải danh sách vé."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function setQty(id: number, next: number) {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.min(MAX_QTY, Math.max(1, next)),
    }));
  }

  async function handleInitiateOrder(ticketType: TicketTypeDto) {
    setError(null);
    setSuccess(null);
    setModalError(null);

    if (authLoading) return;

    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent("/tickets")}`);
      return;
    }

    const quantity = quantities[ticketType.id] ?? 1;
    setBuyingId(ticketType.id);

    try {
      // 1. Send request to backend API POST /api/ticketing/create-order
      const res: CreateOrderResponseDto = await placeTicketOrder({
        ticketTypeId: ticketType.id,
        quantity,
      });

      const totalAmount = res.amount ?? ticketType.price * quantity;

      // 2. Open payment modal with order details & QR link
      setPendingOrder({
        ticketType,
        quantity,
        orderCode: res.orderCode,
        checkoutUrl: res.checkoutUrl,
        qrCode: res.qrCode,
        amount: totalAmount,
      });
    } catch (err) {
      setError(
        getDisplayError(err, "Không thể khởi tạo đơn hàng vé. Vui lòng thử lại."),
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
      setSuccess(`Thanh toán thành công đơn hàng #${pendingOrder.orderCode}!`);
      setPendingOrder(null);
      router.push("/tickets/mine?purchased=1");
    } catch (err) {
      setModalError(
        getDisplayError(
          err,
          "Xác nhận thanh toán thất bại hoặc chưa nhận được tiền. Vui lòng kiểm tra lại!",
        ),
      );
    } finally {
      setConfirming(false);
    }
  }

  async function handleCancelOrder() {
    if (!pendingOrder) return;

    setCancelling(true);
    setModalError(null);

    try {
      await cancelTicketOrder(pendingOrder.orderCode);
      setError(`Đã hủy đơn hàng #${pendingOrder.orderCode}.`);
      setPendingOrder(null);
    } catch (err) {
      setModalError(
        getDisplayError(err, "Hủy đơn hàng thất bại. Vui lòng thử lại."),
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
            Tickets
          </p>
          <h1
            className="text-3xl font-semibold tracking-tight sm:text-4xl"
            style={{ color: C.text }}
          >
            Mua vé tham quan
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed" style={{ color: C.muted }}>
            Chọn loại vé và số lượng để mua vé trực tuyến dễ dàng và nhanh chóng.
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
              Vé của tôi
            </Link>
          </div>
        </header>

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
            Đang tải loại vé…
          </div>
        ) : types.length === 0 ? (
          <div
            className="rounded-3xl px-8 py-16 text-center text-sm"
            style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.muted }}
          >
            Hiện chưa có loại vé nào đang mở bán.
          </div>
        ) : (
          <ul className="space-y-4">
            {types.map((ticket) => {
              const qty = quantities[ticket.id] ?? 1;
              const busy = buyingId === ticket.id;
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
                    <h2 className="text-lg font-semibold" style={{ color: C.text }}>
                      {ticket.name}
                    </h2>
                    {ticket.description ? (
                      <p className="mt-1 text-sm leading-relaxed" style={{ color: C.muted }}>
                        {ticket.description}
                      </p>
                    ) : null}
                    <p
                      className="mt-3 text-xl font-semibold tabular-nums"
                      style={{ color: C.secondary }}
                    >
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
                        aria-label="Giảm số lượng"
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
                        aria-label="Tăng số lượng"
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
                      onClick={() => handleInitiateOrder(ticket)}
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
                          Đang tạo đơn…
                        </>
                      ) : isAuthenticated ? (
                        "Mua vé"
                      ) : (
                        "Đăng nhập để mua"
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      {/* ═══ PAYMENT MODAL ═══ */}
      {pendingOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleCancelOrder}
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
                  Thanh toán đơn hàng
                </h3>
                <p className="text-xs" style={{ color: C.mutedLight }}>
                  Mã đơn: <span className="font-mono font-semibold" style={{ color: C.secondary }}>{pendingOrder.orderCode}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={cancelling || confirming}
                className="rounded-full p-2 hover:bg-[rgba(200,155,60,0.15)] transition-colors disabled:opacity-50"
                style={{ color: C.muted }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Order summary */}
            <div
              className="rounded-2xl p-4 space-y-2 text-sm"
              style={{ background: "rgba(200,155,60,0.08)", border: `1px solid ${C.border}` }}
            >
              <div className="flex justify-between">
                <span style={{ color: C.muted }}>Loại vé:</span>
                <span className="font-semibold" style={{ color: C.text }}>{pendingOrder.ticketType.name}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: C.muted }}>Số lượng:</span>
                <span className="font-semibold" style={{ color: C.text }}>{pendingOrder.quantity} vé</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2" style={{ borderColor: C.border }}>
                <span className="font-medium" style={{ color: C.text }}>Tổng thanh toán:</span>
                <span className="text-lg font-bold" style={{ color: C.secondary }}>
                  {formatVnd(pendingOrder.amount)}
                </span>
              </div>
            </div>

            {/* QR Code section */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl border text-center space-y-3" style={{ borderColor: C.border, background: C.bg }}>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: C.primary }}>
                <QrCode className="h-4 w-4" /> Mã QR Thanh toán VietQR / PayOS
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
                      alt="Mã QR thanh toán VietQR / PayOS"
                      className="w-48 h-48 object-contain mx-auto"
                    />
                  );
                })()}
              </div>

              <p className="text-xs max-w-xs" style={{ color: C.muted }}>
                Mở ứng dụng Ngân hàng / ví điện tử để quét mã QR thanh toán hoặc bấm nút PayOS bên dưới.
              </p>

              {pendingOrder.checkoutUrl && (
                <a
                  href={pendingOrder.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-medium underline transition-opacity hover:opacity-80"
                  style={{ color: C.secondary }}
                >
                  Mở trang thanh toán PayOS <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>

            {/* Modal Error */}
            {modalError && (
              <div
                className="rounded-2xl px-4 py-3 text-xs"
                style={{
                  background: "rgba(139,58,58,0.08)",
                  border: "1px solid rgba(139,58,58,0.25)",
                  color: "#8B3A3A",
                }}
              >
                {modalError}
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={confirming || cancelling}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{
                  background: `linear-gradient(135deg, ${C.primary} 0%, ${C.secondary} 100%)`,
                  color: C.surface,
                }}
              >
                {confirming ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang kiểm tra thanh toán…
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    Xác nhận đã thanh toán
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={confirming || cancelling}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-medium border transition-colors hover:bg-stone-100 disabled:opacity-50"
                style={{ borderColor: C.border, color: C.muted }}
              >
                {cancelling ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Đang hủy đơn…
                  </>
                ) : (
                  "Đóng / Hủy đơn"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
