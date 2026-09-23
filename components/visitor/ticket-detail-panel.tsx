"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, ArrowLeft, Loader2, QrCode, ShieldCheck, RotateCcw, Clock, X, AlertCircle } from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { useAuth } from "@/context/auth-context";
import { formatDateTimeVi, formatVnd } from "@/lib/format";
import { labelStatus } from "@/lib/status-labels";
import { getDisplayError } from "@/lib/validation";
import { checkInTicket, getTicketDetail, requestTicketRefund } from "@/services/visitor/ticketing.service";
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

  // Refund request state
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [bankName, setBankName] = useState("Vietcombank");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);
  const [refundSuccess, setRefundSuccess] = useState(false);

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
        if (res?.latestRefundRequest) {
          if (res.latestRefundRequest.bankName) setBankName(res.latestRefundRequest.bankName);
          if (res.latestRefundRequest.accountNumber) setAccountNumber(res.latestRefundRequest.accountNumber);
          if (res.latestRefundRequest.accountHolderName) setAccountHolderName(res.latestRefundRequest.accountHolderName);
          if (res.latestRefundRequest.reason) setRefundReason(res.latestRefundRequest.reason);
        }
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
      setCheckInError(getDisplayError(err, "Check-in thất bại. Vé có thể đã dùng, hết hạn, hoặc mã không hợp lệ."));
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleRequestRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail) return;
    if (!bankName.trim() || !accountNumber.trim() || !accountHolderName.trim() || !refundReason.trim()) {
      setRefundError("Vui lòng điền đầy đủ các thông tin yêu cầu.");
      return;
    }

    setRefundLoading(true);
    setRefundError(null);
    try {
      await requestTicketRefund(detail.id, {
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountHolderName: accountHolderName.trim(),
        reason: refundReason.trim(),
      });
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              status: "Refund_Pending",
              latestRefundRequest: {
                id: prev.latestRefundRequest?.id ?? 0,
                amount: prev.price ?? prev.ticketType.price,
                reason: refundReason.trim(),
                bankName: bankName.trim(),
                accountNumber: accountNumber.trim(),
                accountHolderName: accountHolderName.trim(),
                status: "Pending",
                rejectReason: null,
                createdAt: new Date().toISOString(),
                processedAt: null,
              },
            }
          : null
      );
      setRefundSuccess(true);
      setIsRefundModalOpen(false);
    } catch (err: unknown) {
      setRefundError(getDisplayError(err, "Gửi yêu cầu hoàn vé thất bại. Vui lòng thử lại."));
    } finally {
      setRefundLoading(false);
    }
  };

  const isPaidOrActive = detail?.status === "Paid" || detail?.status === "Active";
  const isUsed = detail?.status === "Used";
  const isRefundPending = detail?.status === "Refund_Pending";
  const isRefunded = detail?.status === "Refunded";
  const hasRejectedRefund = detail?.latestRefundRequest?.status === "Rejected";

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 pb-20 pt-28 sm:px-8">
        <Link
          href="/tickets/mine"
          prefetch={false}
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
            <p>{loadError}</p>
            <Link
              href="/tickets/mine"
              prefetch={false}
              className="mt-6 inline-flex rounded-full px-5 py-2.5 text-sm font-medium"
              style={{
                background: `linear-gradient(135deg, ${C.primary} 0%, ${C.secondary} 100%)`,
                color: C.surface,
              }}
            >
              Về vé của tôi
            </Link>
          </div>
        ) : !detail ? (
          <div
            className="rounded-3xl px-8 py-16 text-center"
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              color: C.muted,
            }}
          >
            <p className="text-sm font-medium" style={{ color: C.text }}>
              Không tìm thấy vé
            </p>
            <p className="mt-2 text-sm">
              Vé không tồn tại, không thuộc tài khoản này, hoặc đã bị xóa.
            </p>
            <Link
              href="/tickets/mine"
              prefetch={false}
              className="mt-6 inline-flex rounded-full px-5 py-2.5 text-sm font-medium"
              style={{
                background: `linear-gradient(135deg, ${C.primary} 0%, ${C.secondary} 100%)`,
                color: C.surface,
              }}
            >
              Về vé của tôi
            </Link>
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
                    : isRefundPending
                    ? "rgba(234,179,8,0.15)"
                    : isRefunded
                    ? "rgba(239,68,68,0.15)"
                    : isPaidOrActive
                    ? "rgba(60,120,80,0.15)"
                    : "rgba(180,60,60,0.15)",
                  color: isUsed
                    ? "#A67C2D"
                    : isRefundPending
                    ? "#B45309"
                    : isRefunded
                    ? "#DC2626"
                    : isPaidOrActive
                    ? "#2F5D3A"
                    : "#8B2626",
                }}
              >
                {isRefundPending
                  ? "Chờ duyệt hoàn tiền"
                  : isRefunded
                  ? "Đã hoàn tiền"
                  : labelStatus(detail.status)}
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

            {isRefundPending && (
              <div
                className="flex items-start gap-3 rounded-2xl p-4 text-sm font-medium"
                style={{
                  background: "rgba(234,179,8,0.12)",
                  border: "1px solid rgba(234,179,8,0.3)",
                  color: "#B45309",
                }}
              >
                <Clock className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <strong>Yêu cầu hoàn vé đang được xử lý:</strong> Ban quản lý bảo tàng đang kiểm tra thông tin tài khoản ngân hàng của bạn để hoàn tiền. Mã vé tạm thời bị tạm khóa.
                </div>
              </div>
            )}

            {isRefunded && (
              <div
                className="flex items-start gap-3 rounded-2xl p-4 text-sm font-medium"
                style={{
                  background: "rgba(239,68,68,0.10)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  color: "#DC2626",
                }}
              >
                <RotateCcw className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <strong>Vé đã được hoàn tiền:</strong> Ban quản lý bảo tàng đã xác nhận hoàn tiền cho vé này. Mã QR check-in đã bị vô hiệu hóa và không còn giá trị vào cổng.
                </div>
              </div>
            )}

            {hasRejectedRefund && !isRefundPending && !isRefunded && (
              <div
                className="flex flex-col gap-2 rounded-2xl p-4 sm:p-5 text-sm font-medium"
                style={{
                  background: "rgba(220,38,38,0.08)",
                  border: "1px solid rgba(220,38,38,0.25)",
                  color: "#991B1B",
                }}
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-600" />
                  <div className="flex-1">
                    <strong className="text-red-800 text-base">Yêu cầu hoàn tiền trước đó đã bị từ chối</strong>
                    <div className="mt-2 rounded-xl bg-red-100/70 p-3 text-xs leading-relaxed text-red-900 border border-red-200">
                      <p>
                        <strong>Lý do từ chối:</strong> {detail.latestRefundRequest?.rejectReason || "Thông tin hoàn tiền không trùng khớp hoặc không hợp lệ."}
                      </p>
                      {detail.latestRefundRequest?.processedAt && (
                        <p className="mt-1 text-[11px] text-red-700/80">
                          Thời gian phản hồi: {formatDateTimeVi(detail.latestRefundRequest.processedAt)}
                        </p>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-amber-950 font-normal">
                      💡 Vé của bạn vẫn ở trạng thái <strong>Hợp lệ ({labelStatus(detail.status)})</strong>. Bạn có thể nhấn <strong>&quot;Tạo lại yêu cầu hoàn tiền&quot;</strong> bên dưới để cập nhật đúng thông tin tài khoản, hoặc sử dụng vé để vào cổng bình thường.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {refundSuccess && (
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
                  <strong>Yêu cầu hoàn tiền đã được gửi!</strong> Ban quản lý bảo tàng sẽ liên hệ và hoàn tiền vào tài khoản ngân hàng của bạn sớm nhất có thể.
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

                <div className="mt-4 pt-3 border-t flex items-center justify-center gap-2" style={{ borderColor: C.border }}>
                  <button
                    type="button"
                    onClick={() => {
                      setRefundError(null);
                      setIsRefundModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl transition-colors hover:bg-black/5"
                    style={{ color: "#B45309" }}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    {hasRejectedRefund ? "Tạo lại yêu cầu hoàn tiền" : "Yêu cầu hoàn tiền vé"}
                  </button>
                </div>
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
                      : "Không thời hạn (Vô thời hạn)"
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
                  label="Đơn giá"
                  value={formatVnd(
                    detail.price != null ? detail.price : detail.ticketType.price,
                  )}
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

            {detail.latestRefundRequest && (
              <section
                className="border-t pt-6"
                style={{ borderColor: C.border }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold" style={{ color: C.text }}>
                    Yêu cầu hoàn tiền gần nhất
                  </h2>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{
                      background:
                        detail.latestRefundRequest.status === "Approved"
                          ? "rgba(60,120,80,0.15)"
                          : detail.latestRefundRequest.status === "Rejected"
                          ? "rgba(220,38,38,0.15)"
                          : "rgba(234,179,8,0.15)",
                      color:
                        detail.latestRefundRequest.status === "Approved"
                          ? "#2F5D3A"
                          : detail.latestRefundRequest.status === "Rejected"
                          ? "#DC2626"
                          : "#B45309",
                    }}
                  >
                    {detail.latestRefundRequest.status === "Approved"
                      ? "Đã duyệt hoàn tiền"
                      : detail.latestRefundRequest.status === "Rejected"
                      ? "Đã bị từ chối"
                      : "Đang chờ duyệt"}
                  </span>
                </div>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <Field label="Số tiền yêu cầu" value={formatVnd(detail.latestRefundRequest.amount)} />
                  <Field
                    label="Ngân hàng"
                    value={`${detail.latestRefundRequest.bankName} - ${detail.latestRefundRequest.accountNumber}`}
                  />
                  <Field label="Chủ tài khoản" value={detail.latestRefundRequest.accountHolderName} />
                  <Field
                    label="Ngày gửi yêu cầu"
                    value={formatDateTimeVi(detail.latestRefundRequest.createdAt)}
                  />
                  <div className="sm:col-span-2">
                    <Field label="Lý do hoàn vé của bạn" value={detail.latestRefundRequest.reason} />
                  </div>
                  {detail.latestRefundRequest.status === "Rejected" && (
                    <div className="sm:col-span-2 rounded-2xl bg-red-50 p-3.5 border border-red-200 text-xs">
                      <strong className="text-red-800 block mb-1 text-sm font-bold">Lý do từ chối từ Ban quản lý:</strong>
                      <p className="text-red-950 font-medium leading-relaxed">
                        {detail.latestRefundRequest.rejectReason || "Ban quản lý từ chối yêu cầu hoàn tiền."}
                      </p>
                      {detail.latestRefundRequest.processedAt && (
                        <p className="mt-1.5 text-[11px] text-red-700/80">
                          Thời gian từ chối: {formatDateTimeVi(detail.latestRefundRequest.processedAt)}
                        </p>
                      )}
                    </div>
                  )}
                </dl>
              </section>
            )}

            <section
              className="border-t pt-6"
              style={{ borderColor: C.border }}
            >
              <h2 className="mb-3 text-sm font-semibold" style={{ color: C.text }}>
                Mã QR Vé
              </h2>
              <div
                className="rounded-2xl p-5 text-center"
                style={{
                  background: C.bg,
                  border: `1px solid ${C.border}`,
                }}
              >
                {isRefunded ? (
                  <div className="py-6">
                    <div
                      className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl"
                      style={{
                        background: "rgba(239,68,68,0.08)",
                        border: "1px dashed rgba(239,68,68,0.3)",
                      }}
                    >
                      <RotateCcw className="h-10 w-10 text-red-500 opacity-60" />
                    </div>
                    <p className="mt-3 text-sm font-bold text-red-600">
                      MÃ QR ĐÃ BỊ VÔ HIỆU HÓA
                    </p>
                    <p className="mt-1 text-xs" style={{ color: C.muted }}>
                      Vé này đã được hoàn tiền thành công, không thể sử dụng để quét check-in vào bảo tàng.
                    </p>
                  </div>
                ) : detail.qrCodeData &&
                (detail.qrCodeData.startsWith("http") ||
                  detail.qrCodeData.startsWith("data:image")) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={detail.qrCodeData}
                    alt="Mã QR check-in"
                    className="mx-auto h-44 w-44 rounded-xl object-contain"
                    style={{ background: "#fff", border: `1px solid ${C.border}` }}
                  />
                ) : (
                  <div
                    className="mx-auto flex h-28 w-28 items-center justify-center rounded-xl"
                    style={{
                      background: C.surface,
                      border: `1px dashed ${C.border}`,
                    }}
                  >
                    <QrCode className="h-14 w-14" style={{ color: C.primary }} />
                  </div>
                )}
                {!isRefunded && (
                  <>
                    <p className="mt-4 text-sm font-medium" style={{ color: C.text }}>
                      Đưa mã này cho cổng khi check-in
                    </p>
                    <p
                      className="mt-2 break-all font-mono text-lg font-semibold tracking-wide"
                      style={{ color: C.text }}
                    >
                      {detail.qrCodeData || detail.ticketCode || "—"}
                    </p>
                  </>
                )}
              </div>
            </section>
          </article>
        )}
      </main>

      {/* Refund Request Modal */}
      {isRefundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div
            className="relative w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200"
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
            }}
          >
            <button
              onClick={() => setIsRefundModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-stone-400 transition-colors hover:bg-black/5 hover:text-stone-700"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-2xl"
                style={{ background: "rgba(200,155,60,0.15)", color: C.primary }}
              >
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: C.text }}>
                  Yêu cầu hoàn tiền vé
                </h3>
                <p className="text-xs" style={{ color: C.muted }}>
                  Số tiền hoàn: <strong className="text-amber-700 text-sm font-semibold">{formatVnd(detail?.price != null ? detail.price : (detail?.ticketType.price ?? 0))}</strong>
                </p>
              </div>
            </div>

            {refundError && (
              <div className="mb-4 rounded-2xl bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200">
                {refundError}
              </div>
            )}

            <form onSubmit={handleRequestRefund} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: C.muted }}>
                  Ngân hàng nhận tiền *
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  required
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all"
                  style={{
                    background: C.bg,
                    border: `1px solid ${C.border}`,
                    color: C.text,
                  }}
                >
                  <option value="Vietcombank">Vietcombank (VCB)</option>
                  <option value="MBBank">MB Bank (Quân Đội)</option>
                  <option value="Techcombank">Techcombank (TCB)</option>
                  <option value="BIDV">BIDV</option>
                  <option value="VietinBank">VietinBank</option>
                  <option value="ACB">ACB (Á Châu)</option>
                  <option value="VPBank">VPBank</option>
                  <option value="TPBank">TPBank</option>
                  <option value="Agribank">Agribank</option>
                  <option value="MoMo">Ví điện tử MoMo</option>
                  <option value="Khác">Ngân hàng khác</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: C.muted }}>
                  Số tài khoản *
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="VD: 1029384756"
                  required
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all font-mono"
                  style={{
                    background: C.bg,
                    border: `1px solid ${C.border}`,
                    color: C.text,
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: C.muted }}>
                  Tên chủ tài khoản (viết hoa không dấu) *
                </label>
                <input
                  type="text"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value.toUpperCase())}
                  placeholder="VD: NGUYEN VAN A"
                  required
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all font-mono"
                  style={{
                    background: C.bg,
                    border: `1px solid ${C.border}`,
                    color: C.text,
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: C.muted }}>
                  Lý do hoàn vé *
                </label>
                <textarea
                  rows={2}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="VD: Bận việc đột xuất không thể tham quan..."
                  required
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all resize-none"
                  style={{
                    background: C.bg,
                    border: `1px solid ${C.border}`,
                    color: C.text,
                  }}
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRefundModalOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium transition-colors hover:bg-black/5"
                  style={{ color: C.muted }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={refundLoading}
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #C89B3C 0%, #A67C2D 100%)",
                    boxShadow: "0 4px 12px rgba(200,155,60,0.3)",
                  }}
                >
                  {refundLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    "Gửi yêu cầu hoàn vé"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
