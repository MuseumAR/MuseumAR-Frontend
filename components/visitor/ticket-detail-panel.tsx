"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, ArrowLeft, Loader2, QrCode, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { useAuth } from "@/context/auth-context";
import { formatDateTimeVi, formatVnd } from "@/lib/format";
import { labelStatus } from "@/lib/status-labels";
import { getDisplayError } from "@/lib/validation";
import { checkInTicket, getTicketDetail } from "@/services/visitor/ticketing.service";
import type { TicketDetailDto } from "@/types/api";
import { useLanguage } from "@/context/language-context";

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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide" style={{ color: C.mutedLight }}>
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium" style={{ color: C.text }}>
        {value}
      </dd>
    </div>
  );
}

export function TicketDetailPanel() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { language, t } = useLanguage();
  const ticketId = Number(params.id);
  const idValid = Number.isFinite(ticketId);
  const [detail, setDetail] = useState<TicketDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  const [checkInError, setCheckInError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace(
        `/login?next=${encodeURIComponent(`/tickets/mine/${params.id}`)}`,
      );
      return;
    }

    const id = Number(params.id);
    if (!Number.isFinite(id)) return;

    let cancelled = false;
    getTicketDetail(id, language)
      .then((res) => {
        if (cancelled) return;
        setDetail(res);
        setLoadError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setDetail(null);
        setLoadError(getDisplayError(err, t("mytickets.error_detail")));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, params.id, router, language, t]);

  const handleSelfCheckIn = async () => {
    if (!detail || !detail.ticketCode) return;

    setCheckInLoading(true);
    setCheckInError(null);
    try {
      const res = await checkInTicket(detail.ticketCode);
      if (res && res.isValid) {
        setDetail((prev) => (prev ? { ...prev, status: "Used" } : null));
        setCheckInSuccess(true);
      } else {
        setCheckInError(res.message || "Check-in không thành công.");
      }
    } catch (err: unknown) {
      console.error("Failed to self check-in:", err);
      const errMsg = err instanceof Error ? err.message : "Check-in thất bại. Vui lòng thử lại.";
      setCheckInError(errMsg);
    } finally {
      setCheckInLoading(false);
    }
  };

  const isPaidOrActive = detail?.status === "Paid" || detail?.status === "Active";
  const isUsed = detail?.status === "Used";

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 pb-20 pt-28 sm:px-8">
        <Link
          href="/tickets/mine"
          className="mb-6 inline-flex items-center gap-1.5 text-sm transition-opacity hover:opacity-80"
          style={{ color: C.muted }}
        >
          <ArrowLeft className="h-4 w-4" />
          Vé của tôi
        </Link>

        {authLoading || (isAuthenticated && idValid && loading) ? (
          <div
            className="flex items-center justify-center gap-2 rounded-3xl py-24 text-sm"
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              color: C.muted,
            }}
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải chi tiết…
          </div>
        ) : loadError ? (
          <div
            className="rounded-3xl px-8 py-16 text-center text-sm"
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              color: "#8B3A3A",
            }}
            role="alert"
          >
            {loadError}
          </div>
        ) : !detail ? (
          <div
            className="rounded-3xl px-8 py-16 text-center text-sm"
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              color: C.muted,
            }}
          >
            Không tìm thấy vé.
          </div>
        ) : (
          <article
            className="space-y-6 rounded-3xl p-6 sm:p-8"
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              boxShadow: "0 8px 28px rgba(43,29,14,0.06)",
            }}
          >
            <header>
              <p
                className="text-xs font-medium uppercase tracking-[0.2em]"
                style={{ color: C.primary }}
              >
                Chi tiết vé
              </p>
              <h1
                className="mt-2 text-2xl font-semibold tracking-tight"
                style={{ color: C.text }}
              >
                {detail.ticketType.name}
              </h1>
              <p className="mt-1 font-mono text-sm" style={{ color: C.muted }}>
                {detail.ticketCode}
              </p>
              <span
                className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                style={{
                  background: isUsed
                    ? "rgba(200,140,40,0.15)"
                    : isPaidOrActive
                    ? "rgba(60,120,80,0.15)"
                    : "rgba(180,60,60,0.15)",
                  color: isUsed
                    ? "#A67C2D"
                    : isPaidOrActive
                    ? "#2F5D3A"
                    : "#8B2626",
                }}
              >
                    {labelStatus(detail.status)}
              </span>
            </header>

            {/* Check-in Banner / Notifications */}
            {checkInSuccess && (
              <div
                className="flex items-start gap-3 rounded-2xl p-4 text-sm font-medium"
                style={{
                  background: "rgba(60,120,80,0.12)",
                  border: "1px solid rgba(60,120,80,0.3)",
                  color: "#2F5D3A",
                }}
              >
                <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <strong>Check-in thành công!</strong> Vé của bạn đã chuyển sang trạng thái <em>{labelStatus(detail.status)}</em>. Vui lòng xuất trình màn hình này cho nhân viên bảo tàng để vào cổng.
                </div>
              </div>
            )}

            {checkInError && (
              <div
                className="flex items-start gap-3 rounded-2xl p-4 text-sm font-medium"
                style={{
                  background: "rgba(180,60,60,0.12)",
                  border: "1px solid rgba(180,60,60,0.3)",
                  color: "#8B2626",
                }}
              >
                <div>{checkInError}</div>
              </div>
            )}

            {/* Self Check-in Button */}
            {isPaidOrActive && (
              <div
                className="rounded-2xl p-5 text-center"
                style={{
                  background: C.bg,
                  border: `1px solid ${C.border}`,
                }}
              >
                <p className="text-sm font-medium mb-3" style={{ color: C.text }}>
                  📍 Bạn đã tới cửa bảo tàng? Hãy bấm nút bên dưới để tự Check-in vào cổng.
                </p>
                <button
                  onClick={handleSelfCheckIn}
                  disabled={checkInLoading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-bold transition-transform active:scale-[0.99] disabled:opacity-50"
                  style={{
                    background: `linear-gradient(135deg, #3C7850 0%, #2F5D3A 100%)`,
                    color: "#FFF8E7",
                    boxShadow: "0 4px 14px rgba(60,120,80,0.3)",
                  }}
                >
                  {checkInLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang xử lý Check-in...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      TỰ CHECK-IN VÀO CỔNG NGAY
                    </>
                  )}
                </button>
              </div>
            )}

            {isUsed && !checkInSuccess && (
              <div
                className="rounded-2xl p-4 text-center text-xs font-medium"
                style={{
                  background: "rgba(200,155,60,0.10)",
                  border: `1px solid ${C.border}`,
                  color: C.muted,
                }}
              >
                ✓ Vé này đã được check-in vào cổng. Vui lòng đưa màn hình này cho nhân viên bảo tàng nếu cần xác nhận.
              </div>
            )}

            <section>
              <h2 className="mb-3 text-sm font-semibold" style={{ color: C.text }}>
                Vé
              </h2>
              <dl className="grid gap-4 sm:grid-cols-2">
                <Field label="Mã vé" value={detail.ticketCode} />
                <Field label="Trạng thái" value={labelStatus(detail.status)} />
                <Field
                  label="Ngày mua"
                  value={formatDateTimeVi(detail.purchaseDate)}
                />
                <Field
                  label="Hiệu lực"
                  value={
                    detail.validDate
                      ? formatDateTimeVi(detail.validDate)
                      : "Chưa gán"
                  }
                />
              </dl>
            </section>

            <section
              className="border-t pt-6"
              style={{ borderColor: C.border }}
            >
              <h2 className="mb-3 text-sm font-semibold" style={{ color: C.text }}>
                Loại vé
              </h2>
              <dl className="grid gap-4 sm:grid-cols-2">
                <Field label="Tên" value={detail.ticketType.name} />
                <Field
                  label="Giá"
                  value={formatVnd(detail.ticketType.price)}
                />
                <div className="sm:col-span-2">
                  <Field
                    label="Mô tả"
                    value={detail.ticketType.description || "—"}
                  />
                </div>
              </dl>
            </section>

            <section
              className="border-t pt-6"
              style={{ borderColor: C.border }}
            >
              <h2 className="mb-3 text-sm font-semibold" style={{ color: C.text }}>
                Bảo tàng / Triển lãm
              </h2>
              <dl className="grid gap-4 sm:grid-cols-2">
                <Field label="Bảo tàng" value={detail.museum.name} />
                <Field
                  label="Địa chỉ"
                  value={detail.museum.address || "—"}
                />
                <Field
                  label="Triển lãm"
                  value={detail.exhibition?.name || "—"}
                />
              </dl>
            </section>

            <section
              className="border-t pt-6"
              style={{ borderColor: C.border }}
            >
              <h2 className="mb-3 text-sm font-semibold" style={{ color: C.text }}>
                Đơn hàng / Thanh toán
              </h2>
              <dl className="grid gap-4 sm:grid-cols-2">
                <Field label="Mã đơn" value={detail.order.orderCode} />
                <Field
                  label="Tổng tiền"
                  value={`${formatVnd(detail.order.totalAmount)} ${detail.order.currency !== "VND" ? detail.order.currency : ""}`.trim()}
                />
                <Field
                  label="Thanh toán"
                  value={labelStatus(detail.order.paymentStatus)}
                />
                <Field
                  label="Phương thức"
                  value={detail.order.paymentMethod || "—"}
                />
                <Field
                  label="Thời điểm TT"
                  value={
                    detail.order.paidAt
                      ? formatDateTimeVi(detail.order.paidAt)
                      : "—"
                  }
                />
              </dl>
            </section>

            <section
              className="border-t pt-6"
              style={{ borderColor: C.border }}
            >
              <h2 className="mb-3 text-sm font-semibold" style={{ color: C.text }}>
                Mã QR Vé
              </h2>
              <div
                className="flex flex-col items-start gap-3 rounded-2xl p-4 sm:flex-row sm:items-center"
                style={{
                  background: C.bg,
                  border: `1px solid ${C.border}`,
                }}
              >
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-xl"
                  style={{
                    background: C.surface,
                    border: `1px dashed ${C.border}`,
                  }}
                >
                  <QrCode className="h-10 w-10" style={{ color: C.primary }} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: C.text }}>
                    Mã Check-in QR
                  </p>
                  <p className="mt-1 font-mono text-xs break-all" style={{ color: C.muted }}>
                    {detail.qrCodeData || "—"}
                  </p>
                </div>
              </div>
            </section>
          </article>
        )}
      </main>
    </div>
  );
}
