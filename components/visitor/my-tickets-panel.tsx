"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Ticket } from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { useAuth } from "@/context/auth-context";
import { formatDateTimeVi } from "@/lib/format";
import { listMyTickets } from "@/services/visitor/ticketing.service";
import type { TicketDto } from "@/types/api";

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

export function MyTicketsPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<TicketDto[]>([]);
  const [loading, setLoading] = useState(true);
  const purchased = searchParams.get("purchased") === "1";

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent("/tickets/mine")}`);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      // UI mock store only — skips my-tickets API (same VisitorId bug).
      const list = await listMyTickets();
      if (!cancelled) {
        setTickets(list);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, router]);

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 pb-20 pt-28 sm:px-8">
        <header className="mb-10">
          <Link
            href="/tickets"
            className="mb-4 inline-flex items-center gap-1.5 text-sm transition-opacity hover:opacity-80"
            style={{ color: C.muted }}
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại mua vé
          </Link>
          <p
            className="mb-2 text-xs font-medium uppercase tracking-[0.2em]"
            style={{ color: C.primary }}
          >
            My tickets
          </p>
          <h1
            className="text-3xl font-semibold tracking-tight sm:text-4xl"
            style={{ color: C.text }}
          >
            Vé của tôi
          </h1>
          <p className="mt-3 text-sm" style={{ color: C.muted }}>
            Demo UI — vé lưu tạm trên trình duyệt, chưa đồng bộ server.
          </p>
        </header>

        {purchased && (
          <div
            className="mb-6 rounded-2xl px-4 py-3 text-sm"
            style={{
              background: "rgba(60,120,80,0.10)",
              border: "1px solid rgba(60,120,80,0.25)",
              color: "#2F5D3A",
            }}
          >
            Đã thêm vé demo vào danh sách (local).
          </div>
        )}

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
            Đang tải vé…
          </div>
        ) : tickets.length === 0 ? (
          <div
            className="rounded-3xl px-8 py-16 text-center"
            style={{ background: C.surface, border: `1px solid ${C.border}` }}
          >
            <Ticket
              className="mx-auto mb-3 h-8 w-8"
              style={{ color: C.primary }}
            />
            <p className="text-sm" style={{ color: C.muted }}>
              Bạn chưa có vé nào.
            </p>
            <Link
              href="/tickets"
              className="mt-5 inline-flex rounded-full px-5 py-2 text-sm font-medium transition-opacity hover:opacity-90"
              style={{
                background: `linear-gradient(135deg, ${C.primary} 0%, ${C.secondary} 100%)`,
                color: C.surface,
              }}
            >
              Mua vé ngay
            </Link>
          </div>
        ) : (
          <div
            className="overflow-hidden rounded-3xl"
            style={{ background: C.surface, border: `1px solid ${C.border}` }}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr
                    style={{
                      borderBottom: `1px solid ${C.border}`,
                      background: "rgba(245,230,200,0.45)",
                    }}
                  >
                    {["Mã vé", "Loại vé", "Ngày mua", "Hiệu lực", "Trạng thái", ""].map(
                      (label) => (
                        <th
                          key={label || "actions"}
                          className="px-5 py-4 font-medium"
                          style={{ color: C.mutedLight }}
                        >
                          {label}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      style={{ borderBottom: `1px solid ${C.border}` }}
                    >
                      <td
                        className="px-5 py-4 font-mono text-xs"
                        style={{ color: C.text }}
                      >
                        {ticket.ticketCode}
                      </td>
                      <td className="px-5 py-4 font-medium" style={{ color: C.text }}>
                        {ticket.ticketTypeName}
                      </td>
                      <td className="px-5 py-4" style={{ color: C.muted }}>
                        {formatDateTimeVi(ticket.purchaseDate)}
                      </td>
                      <td className="px-5 py-4" style={{ color: C.muted }}>
                        {ticket.validDate
                          ? formatDateTimeVi(ticket.validDate)
                          : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="rounded-full px-2.5 py-1 text-xs font-medium"
                          style={{
                            background: "rgba(60,120,80,0.12)",
                            color: "#2F5D3A",
                          }}
                        >
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/tickets/mine/${ticket.id}`}
                          className="text-sm font-medium transition-opacity hover:opacity-80"
                          style={{ color: C.secondary }}
                        >
                          Chi tiết
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
