"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, QrCode } from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { useAuth } from "@/context/auth-context";
import { formatDateTimeVi, formatVnd } from "@/lib/format";
import { getTicketDetail } from "@/services/visitor/ticketing.service";
import type { TicketDetailDto } from "@/types/api";

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
  const [detail, setDetail] = useState<TicketDetailDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace(
        `/login?next=${encodeURIComponent(`/tickets/mine/${params.id}`)}`,
      );
      return;
    }

    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      setDetail(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await getTicketDetail(id);
      if (!cancelled) {
        setDetail(res);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, params.id, router]);

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

        {authLoading || loading ? (
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
                className="mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
                style={{
                  background: "rgba(60,120,80,0.12)",
                  color: "#2F5D3A",
                }}
              >
                {detail.status}
              </span>
            </header>

            <section>
              <h2 className="mb-3 text-sm font-semibold" style={{ color: C.text }}>
                Vé
              </h2>
              <dl className="grid gap-4 sm:grid-cols-2">
                <Field label="Mã vé" value={detail.ticketCode} />
                <Field label="Trạng thái" value={detail.status} />
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
                  value={detail.order.paymentStatus}
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
                Check-in QR
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
                    qrCodeData
                  </p>
                  <p className="mt-1 font-mono text-xs break-all" style={{ color: C.muted }}>
                    {detail.qrCodeData || "—"}
                  </p>
                  <p className="mt-2 text-xs" style={{ color: C.mutedLight }}>
                    BE nên trả thêm qrCodeImageUrl (URL ảnh QR) nếu có.
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
