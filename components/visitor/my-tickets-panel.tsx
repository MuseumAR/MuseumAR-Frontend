"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Loader2,
  Minus,
  Plus,
  QrCode,
  Search,
  ShieldCheck,
  Ticket,
  Users,
  X,
} from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { StableLabel } from "@/components/shared/stable-label";
import { useAuth } from "@/context/auth-context";
import { useLanguage } from "@/context/language-context";
import { formatDateTimeVi } from "@/lib/format";
import { labelStatus } from "@/lib/status-labels";
import { getDisplayError } from "@/lib/validation";
import { listMyTickets } from "@/services/visitor/ticketing.service";
import { checkInTicket } from "@/services/visitor/ticketing-api.service";
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

type OrderGroup = {
  orderCode: string;
  ticketTypeName: string;
  purchaseDate: string;
  validDate?: string | null;
  totalCount: number;
  paidCount: number;
  usedCount: number;
  focCount: number;
  isGroupOrder: boolean;
  tickets: TicketDto[];
};

export function MyTicketsPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const [tickets, setTickets] = useState<TicketDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const purchased = searchParams.get("purchased") === "1";

  // Filter type state
  const [filterType, setFilterType] = useState<"all" | "group" | "individual">("all");
  // Expanded order codes state
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  // Search query per order
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
  // Status filter per order (all / paid / used)
  const [statusFilters, setStatusFilters] = useState<Record<string, "all" | "paid" | "used">>({});
  // Page index per order
  const [orderPages, setOrderPages] = useState<Record<string, number>>({});
  const PAGE_SIZE = 15;

  // Master QR Modal state
  const [selectedMasterOrder, setSelectedMasterOrder] = useState<OrderGroup | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [checkInQty, setCheckInQty] = useState<number>(1);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInSuccessMsg, setCheckInSuccessMsg] = useState<string | null>(null);
  const [checkInErrorMsg, setCheckInErrorMsg] = useState<string | null>(null);
  const [pageToast, setPageToast] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent("/tickets/mine")}`);
      return;
    }

    let cancelled = false;
    listMyTickets(language)
      .then((list) => {
        if (cancelled) return;
        setTickets(list);
        setError(null);

        // Auto-expand the most recent order group if list is not empty
        if (list.length > 0) {
          const firstOrder = list[0].orderCode || `TICKET_${list[0].id}`;
          setExpandedOrders({ [firstOrder]: true });
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(getDisplayError(err, t("mytickets.error_load")));
        setTickets([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, router, language, t]);

  // Group tickets by OrderCode
  const orderGroups = useMemo<OrderGroup[]>(() => {
    const map = new Map<string, TicketDto[]>();

    for (const ticket of tickets) {
      const key = ticket.orderCode && ticket.orderCode.trim() !== "" ? ticket.orderCode : `TICKET_${ticket.id}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(ticket);
    }

    const groups: OrderGroup[] = [];
    for (const [orderCode, groupTickets] of map.entries()) {
      const first = groupTickets[0];
      const totalCount = groupTickets.length;
      const paidCount = groupTickets.filter((t) => t.status === "Paid" || t.status === "Active").length;
      const usedCount = groupTickets.filter((t) => t.status === "Used").length;
      const focCount = groupTickets.filter((t) => t.isFoc || t.price === 0).length;
      const isGroupOrder = totalCount >= 30 || focCount > 0;

      groups.push({
        orderCode,
        ticketTypeName: first?.ticketTypeName || "Vé tham quan",
        purchaseDate: first?.purchaseDate || "",
        validDate: first?.validDate,
        totalCount,
        paidCount,
        usedCount,
        focCount,
        isGroupOrder,
        tickets: groupTickets,
      });
    }

    return groups;
  }, [tickets]);

  const filteredOrderGroups = useMemo(() => {
    if (filterType === "group") return orderGroups.filter((g) => g.isGroupOrder);
    if (filterType === "individual") return orderGroups.filter((g) => !g.isGroupOrder);
    return orderGroups;
  }, [orderGroups, filterType]);

  const groupOrdersCount = useMemo(() => orderGroups.filter((g) => g.isGroupOrder).length, [orderGroups]);
  const individualOrdersCount = useMemo(() => orderGroups.filter((g) => !g.isGroupOrder).length, [orderGroups]);

  function openMasterModal(group: OrderGroup) {
    setSelectedMasterOrder(group);
    setCheckInQty(group.paidCount > 0 ? group.paidCount : 1);
    setCheckInSuccessMsg(null);
    setCheckInErrorMsg(null);
  }

  async function handleGroupCheckIn() {
    if (!selectedMasterOrder || checkInQty <= 0) return;
    setIsCheckingIn(true);
    setCheckInErrorMsg(null);
    setCheckInSuccessMsg(null);

    try {
      const res = await checkInTicket(selectedMasterOrder.orderCode, checkInQty);
      if (res && res.isValid) {
        setCheckInSuccessMsg(res.message || `Đã check-in thành công cho ${checkInQty} người!`);

        const currentQty = checkInQty;
        const newPaid = Math.max(0, selectedMasterOrder.paidCount - currentQty);

        // Update stepper quantity immediately to the new remaining count
        setCheckInQty(newPaid > 0 ? newPaid : 0);

        // Update local tickets in state: FOC leader tickets check in first, leaving normal guest tickets
        setTickets((prevTickets) => {
          const matchingIds = prevTickets
            .filter((t) => t.orderCode === selectedMasterOrder.orderCode && (t.status === "Paid" || t.status === "Active"))
            .sort((a, b) => (b.isFoc ? 1 : 0) - (a.isFoc ? 1 : 0))
            .slice(0, currentQty)
            .map((t) => t.id);

          const idsSet = new Set(matchingIds);
          return prevTickets.map((t) => (idsSet.has(t.id) ? { ...t, status: "Used" } : t));
        });

        // Update selectedMasterOrder state
        setSelectedMasterOrder((prev) => {
          if (!prev) return null;
          const updatedPaid = Math.max(0, prev.paidCount - currentQty);
          const updatedUsed = prev.usedCount + currentQty;
          return {
            ...prev,
            paidCount: updatedPaid,
            usedCount: updatedUsed,
          };
        });

        // Close popup IMMEDIATELY so user can see updated list without waiting
        setSelectedMasterOrder(null);
        setCheckInSuccessMsg(null);
        setPageToast(res.message || `Đã check-in thành công cho ${currentQty} người!`);

        // Auto-expand accordion & focus on remaining latecomer tickets
        setExpandedOrders((prev) => ({
          ...prev,
          [selectedMasterOrder.orderCode]: true,
        }));
        if (newPaid > 0) {
          setStatusFilters((prev) => ({
            ...prev,
            [selectedMasterOrder.orderCode]: "paid",
          }));
        }
      } else {
        setCheckInErrorMsg(res?.message || "Check-in không thành công.");
      }
    } catch (err: unknown) {
      setCheckInErrorMsg(getDisplayError(err, "Có lỗi xảy ra khi thực hiện Check-in."));
    } finally {
      setIsCheckingIn(false);
    }
  }

  function toggleOrder(orderCode: string) {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderCode]: !prev[orderCode],
    }));
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 pb-20 pt-28 sm:px-8">
        <header className="mb-8">
          <Link
            href="/tickets"
            prefetch={false}
            className="mb-4 inline-flex items-center gap-1.5 text-sm transition-opacity hover:opacity-80"
            style={{ color: C.muted }}
          >
            <ArrowLeft className="h-4 w-4" />
            <StableLabel k="mytickets.back_to_shop" />
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p
                className="mb-1 text-xs font-medium uppercase tracking-[0.2em]"
                style={{ color: C.primary }}
              >
                {t("mytickets.title")}
              </p>
              <h1
                className="text-3xl font-semibold tracking-tight sm:text-4xl"
                style={{ color: C.text }}
              >
                Vé của tôi ({tickets.length} vé)
              </h1>
              <p className="mt-2 text-sm" style={{ color: C.muted }}>
                Quản lý các đơn hàng vé cá nhân và vé đoàn đã mua tại bảo tàng
              </p>
            </div>

            {tickets.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFilterType("all")}
                  className={`rounded-2xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                    filterType === "all"
                      ? "bg-amber-900 text-white shadow"
                      : "bg-amber-100/70 text-amber-900 border border-amber-300 hover:bg-amber-200/60"
                  }`}
                >
                  Tất cả ({orderGroups.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("group")}
                  className={`rounded-2xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                    filterType === "group"
                      ? "bg-amber-600 text-white shadow"
                      : "bg-amber-100/70 text-amber-900 border border-amber-300 hover:bg-amber-200/60"
                  }`}
                >
                  👥 Vé đoàn ({groupOrdersCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("individual")}
                  className={`rounded-2xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                    filterType === "individual"
                      ? "bg-stone-800 text-white shadow"
                      : "bg-stone-100 text-stone-800 border border-stone-300 hover:bg-stone-200"
                  }`}
                >
                  🎫 Vé cá nhân ({individualOrdersCount})
                </button>
              </div>
            )}
          </div>
        </header>

        {pageToast && (
          <div
            className="mb-6 rounded-2xl px-4 py-3 text-sm font-medium flex items-center justify-between gap-2.5 shadow-sm"
            style={{
              background: "rgba(60,120,80,0.12)",
              border: "1px solid rgba(60,120,80,0.30)",
              color: "#2F5D3A",
            }}
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              <span>{pageToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setPageToast(null)}
              className="rounded-full p-1 hover:bg-black/5 text-stone-500 hover:text-stone-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {purchased && (
          <div
            className="mb-6 rounded-2xl px-4 py-3 text-sm font-medium flex items-center gap-2.5"
            style={{
              background: "rgba(60,120,80,0.10)",
              border: "1px solid rgba(60,120,80,0.25)",
              color: "#2F5D3A",
            }}
          >
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <span>Thanh toán đơn hàng thành công! Vé của bạn đã được ghi nhận trong hệ thống.</span>
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
            {t("mytickets.loading")}
          </div>
        ) : error ? (
          <div
            className="rounded-3xl px-8 py-16 text-center text-sm"
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              color: "#8B3A3A",
            }}
            role="alert"
          >
            {error}
          </div>
        ) : filteredOrderGroups.length === 0 ? (
          <div
            className="rounded-3xl px-8 py-16 text-center"
            style={{ background: C.surface, border: `1px solid ${C.border}` }}
          >
            <Ticket
              className="mx-auto mb-3 h-8 w-8"
              style={{ color: C.primary }}
            />
            <p className="text-sm" style={{ color: C.muted }}>
              {filterType === "group"
                ? "Bạn chưa có đơn đặt vé đoàn nào."
                : filterType === "individual"
                ? "Bạn chưa có vé cá nhân nào."
                : t("mytickets.no_tickets")}
            </p>
            <Link
              href="/tickets"
              prefetch={false}
              className="mt-5 inline-flex rounded-full px-5 py-2 text-sm font-medium transition-opacity hover:opacity-90"
              style={{
                background: `linear-gradient(135deg, ${C.primary} 0%, ${C.secondary} 100%)`,
                color: C.surface,
              }}
            >
              <StableLabel k="mytickets.buy_now" />
            </Link>
          </div>
        ) : (
          /* ORDER GROUPS LIST */
          <div className="space-y-6">
            {filteredOrderGroups.map((group) => {
              const isExpanded = Boolean(expandedOrders[group.orderCode]);
              const query = (searchQueries[group.orderCode] || "").toLowerCase().trim();
              const statusFilter = statusFilters[group.orderCode] || "all";

              const filteredTickets = group.tickets.filter((t) => {
                if (statusFilter === "paid" && t.status !== "Paid" && t.status !== "Active") return false;
                if (statusFilter === "used" && t.status !== "Used") return false;
                if (query) {
                  return (
                    t.ticketCode.toLowerCase().includes(query) ||
                    t.ticketTypeName.toLowerCase().includes(query) ||
                    (t.isFoc && "foc".includes(query))
                  );
                }
                return true;
              });

              const currentPage = orderPages[group.orderCode] || 1;
              const totalPages = Math.ceil(filteredTickets.length / PAGE_SIZE) || 1;
              const pagedTickets = filteredTickets.slice(
                (currentPage - 1) * PAGE_SIZE,
                currentPage * PAGE_SIZE,
              );

              return (
                <div
                  key={group.orderCode}
                  className="rounded-3xl overflow-hidden transition-all shadow-sm"
                  style={{
                    background: C.surface,
                    border: `1px solid ${group.isGroupOrder ? "#F59E0B" : C.border}`,
                  }}
                >
                  {/* Order Summary Header Card */}
                  <div className="p-5 sm:p-6 border-b" style={{ borderColor: C.border }}>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Left: Order Details & Badges */}
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-amber-900 bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-300">
                            #{group.orderCode.startsWith("TICKET_") ? group.tickets[0]?.ticketCode : group.orderCode}
                          </span>
                          {group.isGroupOrder ? (
                            <span className="inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-bold bg-amber-500 text-white shadow-sm">
                              <Users className="h-3.5 w-3.5" />
                              Đơn Vé Đoàn ({group.totalCount} vé)
                            </span>
                          ) : (
                            <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-stone-200/70 text-stone-800">
                              Vé cá nhân ({group.totalCount} vé)
                            </span>
                          )}
                          {group.focCount > 0 && (
                            <span className="rounded-full px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              🎁 +{group.focCount} vé FOC
                            </span>
                          )}
                        </div>

                        <h2 className="text-xl font-bold" style={{ color: C.text }}>
                          {group.ticketTypeName}
                        </h2>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: C.muted }}>
                          <span>Ngày mua: {formatDateTimeVi(group.purchaseDate)}</span>
                          <span>•</span>
                          <span>
                            Hiệu lực:{" "}
                            {group.validDate ? (
                              formatDateTimeVi(group.validDate)
                            ) : (
                              <strong className="text-emerald-700">Không thời hạn</strong>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Right: Quick Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        {group.isGroupOrder ? (
                          <>
                            {/* Master QR Button for Group Orders */}
                            <button
                              type="button"
                              onClick={() => openMasterModal(group)}
                              className="inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90 shadow-sm"
                              style={{
                                background: "linear-gradient(135deg, #D97706 0%, #B45309 100%)",
                              }}
                            >
                              <QrCode className="h-4 w-4" />
                              Mã QR Trưởng đoàn (Soát vé)
                            </button>

                            {/* Toggle Ticket Details Button */}
                            <button
                              type="button"
                              onClick={() => toggleOrder(group.orderCode)}
                              className="inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-xs font-semibold border transition-colors hover:bg-black/5"
                              style={{ color: C.text, borderColor: C.border }}
                            >
                              {isExpanded ? (
                                <>
                                  Thu gọn vé con
                                  <ChevronUp className="h-4 w-4" />
                                </>
                              ) : (
                                <>
                                  Xem danh sách {group.totalCount} vé con
                                  <ChevronDown className="h-4 w-4" />
                                </>
                              )}
                            </button>
                          </>
                        ) : group.totalCount === 1 ? (
                          /* Direct link for single ticket */
                          <Link
                            href={`/tickets/mine/${group.tickets[0]?.id}`}
                            prefetch={false}
                            className="inline-flex items-center gap-1.5 rounded-2xl px-5 py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90 shadow-sm"
                            style={{
                              background: `linear-gradient(135deg, ${C.primary} 0%, ${C.secondary} 100%)`,
                            }}
                          >
                            <QrCode className="h-4 w-4" />
                            Xem mã QR & Chi tiết
                          </Link>
                        ) : (
                          /* Multi-ticket individual order */
                          <button
                            type="button"
                            onClick={() => toggleOrder(group.orderCode)}
                            className="inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-xs font-semibold border transition-colors hover:bg-black/5"
                            style={{ color: C.text, borderColor: C.border }}
                          >
                            {isExpanded ? (
                              <>
                                Thu gọn vé ({group.totalCount})
                                <ChevronUp className="h-4 w-4" />
                              </>
                            ) : (
                              <>
                                Xem {group.totalCount} vé
                                <ChevronDown className="h-4 w-4" />
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar for Group Check-in */}
                    <div className="mt-4 pt-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs" style={{ borderColor: C.border }}>
                      <div className="flex items-center gap-4">
                        <span style={{ color: C.muted }}>
                          Đã sử dụng: <strong className="text-amber-900">{group.usedCount}</strong> / {group.totalCount} vé
                        </span>
                        <span style={{ color: C.muted }}>
                          Còn hiệu lực: <strong className="text-emerald-700">{group.paidCount}</strong> vé
                        </span>
                      </div>
                      <div className="w-full sm:w-48 h-2 rounded-full bg-amber-200/50 overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all"
                          style={{
                            width: `${group.totalCount > 0 ? (group.usedCount / group.totalCount) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Tickets List (Accordion) */}
                  {isExpanded && (
                    <div className="p-5 sm:p-6 bg-amber-50/30 space-y-4">
                      {/* Search Bar & Status Filter Tabs */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="relative flex-1 max-w-sm">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                          <input
                            type="text"
                            placeholder="Tìm kiếm mã vé (TK-...)"
                            value={searchQueries[group.orderCode] || ""}
                            onChange={(e) => {
                              setSearchQueries((prev) => ({
                                ...prev,
                                [group.orderCode]: e.target.value,
                              }));
                              setOrderPages((prev) => ({
                                ...prev,
                                [group.orderCode]: 1,
                              }));
                            }}
                            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                            style={{ borderColor: C.border }}
                          />
                        </div>

                        {/* Status Tabs for quick latecomer access */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setStatusFilters((prev) => ({ ...prev, [group.orderCode]: "all" }));
                              setOrderPages((prev) => ({ ...prev, [group.orderCode]: 1 }));
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                              statusFilter === "all"
                                ? "bg-stone-800 text-white shadow-xs"
                                : "bg-white text-stone-600 border hover:bg-stone-50"
                            }`}
                            style={{ borderColor: C.border }}
                          >
                            Tất cả ({group.totalCount})
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setStatusFilters((prev) => ({ ...prev, [group.orderCode]: "paid" }));
                              setOrderPages((prev) => ({ ...prev, [group.orderCode]: 1 }));
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              statusFilter === "paid"
                                ? "bg-emerald-700 text-white shadow-xs"
                                : "bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100"
                            }`}
                          >
                            🟢 Chưa dùng ({group.paidCount})
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setStatusFilters((prev) => ({ ...prev, [group.orderCode]: "used" }));
                              setOrderPages((prev) => ({ ...prev, [group.orderCode]: 1 }));
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                              statusFilter === "used"
                                ? "bg-stone-600 text-white shadow-xs"
                                : "bg-white text-stone-500 border hover:bg-stone-50"
                            }`}
                            style={{ borderColor: C.border }}
                          >
                            ⚪ Đã vào ({group.usedCount})
                          </button>
                        </div>
                      </div>

                      {/* Tickets Table */}
                      <div className="overflow-x-auto rounded-2xl border bg-white" style={{ borderColor: C.border }}>
                        <table className="w-full min-w-[560px] text-left text-xs">
                          <thead>
                            <tr className="bg-amber-100/50 border-b font-medium text-stone-600" style={{ borderColor: C.border }}>
                              <th className="px-4 py-3">STT</th>
                              <th className="px-4 py-3">Mã vé (Ticket Code)</th>
                              <th className="px-4 py-3">Phân loại</th>
                              <th className="px-4 py-3">Trạng thái</th>
                              <th className="px-4 py-3 text-right">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y" style={{ borderColor: C.border }}>
                            {pagedTickets.map((tItem, idx) => {
                              const globalIndex = (currentPage - 1) * PAGE_SIZE + idx + 1;
                              return (
                                <tr key={tItem.id} className="hover:bg-amber-50/60 transition-colors">
                                  <td className="px-4 py-3 font-mono text-stone-400">
                                    #{globalIndex}
                                  </td>
                                  <td className="px-4 py-3 font-mono font-semibold" style={{ color: C.text }}>
                                    <div className="flex items-center gap-2">
                                      <span>{tItem.ticketCode}</span>
                                      <button
                                        type="button"
                                        title="Sao chép mã vé"
                                        onClick={() => handleCopy(tItem.ticketCode)}
                                        className="p-1 rounded hover:bg-stone-100 text-stone-400 hover:text-stone-700"
                                      >
                                        {copiedCode === tItem.ticketCode ? (
                                          <Check className="h-3 w-3 text-emerald-600" />
                                        ) : (
                                          <Copy className="h-3 w-3" />
                                        )}
                                      </button>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    {tItem.isFoc ? (
                                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                        🎁 Vé FOC (Dẫn đoàn)
                                      </span>
                                    ) : (
                                      <span className="text-stone-600 font-medium">Vé khách</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                                      style={{
                                        background:
                                          tItem.status === "Used"
                                            ? "rgba(125,90,60,0.10)"
                                            : tItem.status === "Refund_Pending"
                                            ? "rgba(234,179,8,0.15)"
                                            : tItem.status === "Refunded"
                                            ? "rgba(239,68,68,0.12)"
                                            : "rgba(60,120,80,0.12)",
                                        color:
                                          tItem.status === "Used"
                                            ? C.muted
                                            : tItem.status === "Refund_Pending"
                                            ? "#B45309"
                                            : tItem.status === "Refunded"
                                            ? "#DC2626"
                                            : "#2F5D3A",
                                      }}
                                    >
                                      {tItem.status === "Refund_Pending"
                                        ? "Chờ hoàn tiền"
                                        : tItem.status === "Refunded"
                                        ? "Đã hoàn tiền"
                                        : labelStatus(tItem.status)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <Link
                                      href={`/tickets/mine/${tItem.id}`}
                                      prefetch={false}
                                      className="font-semibold text-amber-700 hover:text-amber-900 underline underline-offset-2"
                                    >
                                      Chi tiết & QR
                                    </Link>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xs text-stone-500">
                            Trang {currentPage} / {totalPages}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setOrderPages((prev) => ({
                                  ...prev,
                                  [group.orderCode]: Math.max(1, currentPage - 1),
                                }))
                              }
                              disabled={currentPage <= 1}
                              className="px-3 py-1 rounded-lg border text-xs font-semibold disabled:opacity-40 bg-white hover:bg-stone-50"
                            >
                              Trang trước
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setOrderPages((prev) => ({
                                  ...prev,
                                  [group.orderCode]: Math.min(totalPages, currentPage + 1),
                                }))
                              }
                              disabled={currentPage >= totalPages}
                              className="px-3 py-1 rounded-lg border text-xs font-semibold disabled:opacity-40 bg-white hover:bg-stone-50"
                            >
                              Trang sau
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ═══ MASTER QR MODAL (FOR TOUR LEADER / STAFF FAST CHECK-IN) ═══ */}
      {selectedMasterOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedMasterOrder(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 text-center max-h-[92vh] overflow-y-auto"
            style={{ background: C.surface, border: `1px solid ${C.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: C.border }}>
              <div className="text-left">
                <h3 className="text-base font-bold" style={{ color: C.text }}>
                  Mã QR Tổng của Đoàn
                </h3>
                <p className="text-xs text-stone-500">
                  Quét vào cổng cả đoàn hoặc chọn số lượng người vào trước
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMasterOrder(null)}
                className="rounded-full p-1.5 hover:bg-black/5 text-stone-400 hover:text-stone-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Check-in Alerts */}
            {checkInSuccessMsg && (
              <div
                className="rounded-2xl p-3.5 text-left text-xs font-medium flex items-start gap-2.5"
                style={{
                  background: "rgba(60,120,80,0.12)",
                  border: "1px solid rgba(60,120,80,0.3)",
                  color: "#2F5D3A",
                }}
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>{checkInSuccessMsg}</span>
              </div>
            )}

            {checkInErrorMsg && (
              <div
                className="rounded-2xl p-3.5 text-left text-xs font-medium"
                style={{
                  background: "rgba(220,38,38,0.10)",
                  border: "1px solid rgba(220,38,38,0.25)",
                  color: "#991B1B",
                }}
              >
                {checkInErrorMsg}
              </div>
            )}

            {/* QR Code Container */}
            <div
              className="mx-auto flex h-44 w-44 items-center justify-center rounded-2xl p-4 shadow-sm"
              style={{
                background: "#FFF",
                border: `1px solid ${C.border}`,
              }}
            >
              <QrCode className="h-28 w-28" style={{ color: C.primary }} />
            </div>

            {/* Order info */}
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider block" style={{ color: C.mutedLight }}>
                Mã đơn hàng (Master QR Code)
              </span>
              <p className="font-mono text-lg font-bold tracking-wider" style={{ color: C.text }}>
                {selectedMasterOrder.orderCode}
              </p>

              <div className="rounded-2xl bg-amber-50/80 p-3.5 border border-amber-200 text-xs text-left space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-stone-600">Loại vé:</span>
                  <strong className="text-stone-900">{selectedMasterOrder.ticketTypeName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Tổng quy mô đoàn:</span>
                  <strong className="text-amber-900">{selectedMasterOrder.totalCount} vé ({selectedMasterOrder.totalCount - selectedMasterOrder.focCount} vé mua + {selectedMasterOrder.focCount} FOC)</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Đã vào cổng:</span>
                  <strong className="text-stone-800">{selectedMasterOrder.usedCount} vé</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Sẵn sàng Check-in:</span>
                  <strong className="text-emerald-700">{selectedMasterOrder.paidCount} vé</strong>
                </div>
              </div>
            </div>

            {/* PARTIAL / FULL GROUP CHECK-IN SECTION */}
            {selectedMasterOrder.paidCount > 0 ? (
              <div className="rounded-2xl p-4 text-left space-y-3 bg-amber-100/40 border border-amber-300">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-950">
                    Số lượng người vào cổng đợt này:
                  </label>
                  <span className="text-xs text-stone-500 font-mono">
                    Tối đa: {selectedMasterOrder.paidCount} vé
                  </span>
                </div>

                {/* Stepper */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCheckInQty((prev) => Math.max(1, prev - 1))}
                    disabled={checkInQty <= 1 || isCheckingIn}
                    className="h-9 w-9 rounded-xl border bg-white flex items-center justify-center font-bold text-stone-700 hover:bg-stone-50 disabled:opacity-40"
                    style={{ borderColor: C.border }}
                  >
                    <Minus className="h-4 w-4" />
                  </button>

                  <input
                    type="number"
                    min={1}
                    max={selectedMasterOrder.paidCount}
                    value={checkInQty}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) {
                        setCheckInQty(Math.min(selectedMasterOrder.paidCount, Math.max(1, val)));
                      }
                    }}
                    className="flex-1 h-9 text-center font-bold text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    style={{ borderColor: C.border }}
                  />

                  <button
                    type="button"
                    onClick={() => setCheckInQty((prev) => Math.min(selectedMasterOrder.paidCount, prev + 1))}
                    disabled={checkInQty >= selectedMasterOrder.paidCount || isCheckingIn}
                    className="h-9 w-9 rounded-xl border bg-white flex items-center justify-center font-bold text-stone-700 hover:bg-stone-50 disabled:opacity-40"
                    style={{ borderColor: C.border }}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Scenario Hint */}
                {checkInQty < selectedMasterOrder.paidCount && (
                  <p className="text-[11px] text-amber-900 leading-relaxed bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    💡 <strong>Kịch bản đến trước:</strong> Đợt này sẽ Check-in cho <strong>{checkInQty} người</strong>. Còn lại <strong>{selectedMasterOrder.paidCount - checkInQty} bạn đến sau</strong> sẽ dùng mã Vé Con cá nhân (hoặc gửi ảnh QR vé con) để quét vào cổng sau.
                  </p>
                )}

                {/* Confirm Check-in Button */}
                <button
                  type="button"
                  onClick={handleGroupCheckIn}
                  disabled={isCheckingIn || checkInQty <= 0}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold text-white transition-opacity hover:opacity-95 disabled:opacity-50 shadow"
                  style={{
                    background: `linear-gradient(135deg, #3C7850 0%, #2F5D3A 100%)`,
                  }}
                >
                  {isCheckingIn ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang xác nhận Check-in...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      XÁC NHẬN CHECK-IN CHO {checkInQty} NGƯỜI
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="rounded-2xl p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                ✓ Toàn bộ {selectedMasterOrder.totalCount} vé trong đoàn đã được Check-in vào cổng.
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleCopy(selectedMasterOrder.orderCode)}
                className="flex-1 rounded-full py-2.5 text-xs font-semibold border bg-white text-stone-700 hover:bg-stone-50 transition-colors shadow-sm flex items-center justify-center gap-1.5"
                style={{ borderColor: C.border }}
              >
                {copiedCode === selectedMasterOrder.orderCode ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    Đã sao chép!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Sao chép mã đơn
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setSelectedMasterOrder(null)}
                className="flex-1 rounded-full py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
                style={{
                  background: `linear-gradient(135deg, ${C.primary} 0%, ${C.secondary} 100%)`,
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
