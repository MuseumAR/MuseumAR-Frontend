"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, Ticket, Loader2 } from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { useAuth } from "@/context/auth-context";
import { formatVnd } from "@/lib/format";
import { getDisplayError } from "@/lib/validation";
import {
  listPublicTicketTypes,
  purchaseTickets,
} from "@/services/visitor/ticketing.service";
import type { TicketTypeDto } from "@/types/api";

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

export function TicketShop() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [types, setTypes] = useState<TicketTypeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [buyingId, setBuyingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
          setError(getDisplayError(err, "Unable to load ticket types."));
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

  async function handleBuy(ticketType: TicketTypeDto) {
    setError(null);
    setSuccess(null);

    if (authLoading) return;

    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent("/tickets")}`);
      return;
    }

    const quantity = quantities[ticketType.id] ?? 1;
    setBuyingId(ticketType.id);
    try {
      // UI-only — do not call create-order until BE VisitorId mapping is fixed.
      const { orderCode } = await purchaseTickets({
        ticketType,
        quantity,
      });
      setSuccess(
        `Đã mua ${quantity} vé “${ticketType.name}”. Mã đơn: ${orderCode}`,
      );
      router.push("/tickets/mine?purchased=1");
    } catch (err) {
      setError(getDisplayError(err, "Không thể mua vé. Vui lòng thử lại."));
    } finally {
      setBuyingId(null);
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
            Chọn loại vé và số lượng. Hiện chỉ demo UI — chưa gọi API tạo đơn
            (BE đang lỗi map UserId → VisitorId). Vé sẽ lưu tạm trên trình duyệt.
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
            className="mb-6 rounded-2xl px-4 py-3 text-sm"
            style={{
              background: "rgba(60,120,80,0.10)",
              border: "1px solid rgba(60,120,80,0.25)",
              color: "#2F5D3A",
            }}
          >
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
                      onClick={() => handleBuy(ticket)}
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
                          Đang mua…
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
    </div>
  );
}
