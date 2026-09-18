"use client";

import { useEffect, useState, useMemo } from "react";
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Loader2,
  Copy,
  Check,
  Building,
  CreditCard,
  User,
  AlertCircle,
  X,
} from "lucide-react";
import { dashboardTheme as T, cinzel, dashboardTitleClass } from "@/lib/dashboard-theme";
import { formatDateTimeVi, formatVnd } from "@/lib/format";
import {
  getManagerRefundRequests,
  processManagerRefundRequest,
} from "@/services/museum-manager/ticket-api.service";
import type { TicketRefundRequestDto } from "@/types/api";
import { getDisplayError } from "@/lib/validation";
import { SuccessBanner, useSuccessToast } from "@/components/shared/success-banner";

export function RefundsPanel() {
  const [requests, setRequests] = useState<TicketRefundRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"All" | "Pending" | "Approved" | "Rejected">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const { success, showSuccess } = useSuccessToast();

  // Processing modals
  const [selectedRequest, setSelectedRequest] = useState<TicketRefundRequestDto | null>(null);
  const [modalMode, setModalMode] = useState<"approve" | "reject" | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getManagerRefundRequests();
      setRequests(data);
    } catch (err: unknown) {
      setError(getDisplayError(err, "Không thể tải danh sách yêu cầu hoàn tiền."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleCopy = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleProcessSubmit = async () => {
    if (!selectedRequest || !modalMode) return;

    if (modalMode === "reject" && !rejectReason.trim()) {
      setProcessError("Vui lòng nhập lý do từ chối yêu cầu hoàn tiền.");
      return;
    }

    setIsProcessing(true);
    setProcessError(null);
    try {
      await processManagerRefundRequest(selectedRequest.id, {
        isApproved: modalMode === "approve",
        rejectReason: modalMode === "reject" ? rejectReason.trim() : null,
      });

      showSuccess(
        modalMode === "approve"
          ? `Đã xác nhận hoàn tiền thành công cho vé ${selectedRequest.ticketCode}!`
          : `Đã từ chối yêu cầu hoàn tiền của vé ${selectedRequest.ticketCode}.`
      );

      setSelectedRequest(null);
      setModalMode(null);
      setRejectReason("");
      loadRequests();
    } catch (err: unknown) {
      setProcessError(getDisplayError(err, "Thao tác xử lý thất bại. Vui lòng thử lại."));
    } finally {
      setIsProcessing(false);
    }
  };

  // KPIs
  const totalCount = requests.length;
  const pendingCount = requests.filter((r) => r.status === "Pending").length;
  const approvedCount = requests.filter((r) => r.status === "Approved").length;
  const rejectedCount = requests.filter((r) => r.status === "Rejected").length;
  const totalRefundedAmount = requests
    .filter((r) => r.status === "Approved")
    .reduce((sum, r) => sum + r.amount, 0);

  // Filter & Search
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchesTab = activeTab === "All" || req.status === activeTab;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        req.ticketCode.toLowerCase().includes(q) ||
        req.visitorName.toLowerCase().includes(q) ||
        req.bankName.toLowerCase().includes(q) ||
        req.accountNumber.toLowerCase().includes(q) ||
        req.accountHolderName.toLowerCase().includes(q) ||
        req.ticketTypeName.toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [requests, activeTab, searchQuery]);

  return (
    <div className="space-y-6 px-8 pb-10">
      {success && <SuccessBanner message={success} />}

      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1
            className={dashboardTitleClass}
            style={{ fontFamily: cinzel, color: T.text }}
          >
            Quản lý hoàn tiền vé
          </h1>
          <p className="text-xs sm:text-sm" style={{ color: T.muted }}>
            Kiểm tra thông tin tài khoản, duyệt hoàn tiền sau khi chuyển khoản hoặc từ chối yêu cầu từ du khách.
          </p>
        </div>
        <button
          onClick={loadRequests}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all hover:opacity-85 active:scale-95 disabled:opacity-50"
          style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            color: T.text,
          }}
        >
          <RotateCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div
          className="rounded-2xl p-4 border"
          style={{ background: T.surface, borderColor: T.border }}
        >
          <p className="text-xs uppercase font-medium" style={{ color: T.muted }}>
            Tổng yêu cầu
          </p>
          <p className="mt-1 text-2xl font-bold" style={{ color: T.text }}>
            {totalCount}
          </p>
        </div>

        <div
          className="rounded-2xl p-4 border"
          style={{
            background: "rgba(234,179,8,0.06)",
            borderColor: "rgba(234,179,8,0.25)",
          }}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase font-semibold text-amber-700">Chờ duyệt</p>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-1 text-2xl font-bold text-amber-700">{pendingCount}</p>
        </div>

        <div
          className="rounded-2xl p-4 border"
          style={{
            background: "rgba(60,120,80,0.06)",
            borderColor: "rgba(60,120,80,0.25)",
          }}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase font-semibold text-emerald-700">Đã hoàn tiền</p>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{approvedCount}</p>
        </div>

        <div
          className="rounded-2xl p-4 border"
          style={{
            background: "rgba(239,68,68,0.06)",
            borderColor: "rgba(239,68,68,0.25)",
          }}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase font-semibold text-rose-700">Đã từ chối</p>
            <XCircle className="h-4 w-4 text-rose-600" />
          </div>
          <p className="mt-1 text-2xl font-bold text-rose-700">{rejectedCount}</p>
        </div>

        <div
          className="col-span-2 sm:col-span-1 rounded-2xl p-4 border"
          style={{ background: T.surface, borderColor: T.border }}
        >
          <p className="text-xs uppercase font-medium" style={{ color: T.muted }}>
            Tổng tiền đã hoàn
          </p>
          <p className="mt-1 text-xl font-bold text-emerald-700">
            {formatVnd(totalRefundedAmount)}
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-2xl border"
        style={{ background: T.surface, borderColor: T.border }}
      >
        <div className="flex items-center gap-1 overflow-x-auto">
          {(["All", "Pending", "Approved", "Rejected"] as const).map((tab) => {
            const isActive = activeTab === tab;
            const labels = {
              All: `Tất cả (${totalCount})`,
              Pending: `Chờ duyệt (${pendingCount})`,
              Approved: `Đã hoàn (${approvedCount})`,
              Rejected: `Từ chối (${rejectedCount})`,
            };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap"
                style={{
                  background: isActive ? T.primary : "transparent",
                  color: isActive ? "#FFF8E7" : T.muted,
                }}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: T.mutedLight }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm mã vé, tên khách, STK..."
            className="w-full rounded-xl pl-9 pr-3 py-1.5 text-xs outline-none transition-all"
            style={{
              background: T.bg,
              border: `1px solid ${T.border}`,
              color: T.text,
            }}
          />
        </div>
      </div>

      {/* Main Table */}
      <div
        className="overflow-hidden rounded-2xl border"
        style={{ background: T.surface, borderColor: T.border }}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-xs" style={{ color: T.muted }}>
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải danh sách yêu cầu hoàn tiền...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-700">{error}</div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center text-xs" style={{ color: T.muted }}>
            Không có yêu cầu hoàn tiền nào phù hợp với điều kiện tìm kiếm.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr
                  className="border-b font-semibold"
                  style={{
                    borderColor: T.border,
                    background: "rgba(200,155,60,0.05)",
                    color: T.mutedLight,
                  }}
                >
                  <th className="px-4 py-3.5">Mã vé & Loại vé</th>
                  <th className="px-4 py-3.5">Du khách</th>
                  <th className="px-4 py-3.5">Số tiền hoàn</th>
                  <th className="px-4 py-3.5">Thông tin nhận tiền</th>
                  <th className="px-4 py-3.5">Lý do hoàn</th>
                  <th className="px-4 py-3.5">Ngày gửi</th>
                  <th className="px-4 py-3.5">Trạng thái</th>
                  <th className="px-4 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: T.border }}>
                {filteredRequests.map((req) => {
                  const isPending = req.status === "Pending";
                  const isApproved = req.status === "Approved";
                  const isRejected = req.status === "Rejected";

                  return (
                    <tr
                      key={req.id}
                      className="transition-colors hover:bg-amber-50/20"
                      style={{ borderColor: T.border }}
                    >
                      <td className="px-4 py-3.5">
                        <p className="font-mono font-bold" style={{ color: T.primaryDark }}>
                          {req.ticketCode}
                        </p>
                        <p className="text-[11px] font-medium" style={{ color: T.muted }}>
                          {req.ticketTypeName}
                        </p>
                      </td>

                      <td className="px-4 py-3.5">
                        <p className="font-semibold" style={{ color: T.text }}>
                          {req.visitorName}
                        </p>
                        <p className="text-[11px]" style={{ color: T.mutedLight }}>
                          {req.visitorEmail || req.visitorPhone || "—"}
                        </p>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-bold text-amber-800 text-sm">
                          {formatVnd(req.amount)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div
                          className="rounded-xl p-2.5 space-y-1"
                          style={{
                            background: "rgba(245,230,200,0.3)",
                            border: `1px solid ${T.border}`,
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-[11px]" style={{ color: T.text }}>
                              {req.bankName}
                            </span>
                            <button
                              onClick={() => handleCopy(req.accountNumber, req.id)}
                              title="Sao chép số tài khoản"
                              className="inline-flex items-center gap-1 text-[10px] text-amber-700 hover:opacity-80"
                            >
                              {copiedId === req.id ? (
                                <>
                                  <Check className="h-3 w-3 text-emerald-600" />
                                  <span className="text-emerald-600 font-semibold">Đã chép</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  <span>Chép STK</span>
                                </>
                              )}
                            </button>
                          </div>
                          <p className="font-mono font-bold tracking-wider text-xs" style={{ color: T.primaryDark }}>
                            {req.accountNumber}
                          </p>
                          <p className="text-[11px] uppercase font-medium" style={{ color: T.muted }}>
                            {req.accountHolderName}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 max-w-[180px]">
                        <p className="line-clamp-2 text-[11px]" style={{ color: T.text }}>
                          {req.reason}
                        </p>
                        {req.rejectReason && (
                          <p className="mt-1 text-[10px] text-rose-600 italic">
                            Từ chối: {req.rejectReason}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-[11px]" style={{ color: T.muted }}>
                        {formatDateTimeVi(req.createdAt)}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"
                          style={{
                            background: isPending
                              ? "rgba(234,179,8,0.15)"
                              : isApproved
                              ? "rgba(60,120,80,0.15)"
                              : "rgba(239,68,68,0.15)",
                            color: isPending
                              ? "#B45309"
                              : isApproved
                              ? "#2F5D3A"
                              : "#DC2626",
                          }}
                        >
                          {isPending && <Clock className="h-3 w-3" />}
                          {isApproved && <CheckCircle2 className="h-3 w-3" />}
                          {isRejected && <XCircle className="h-3 w-3" />}
                          {isPending ? "Chờ duyệt" : isApproved ? "Đã hoàn" : "Đã từ chối"}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedRequest(req);
                                setModalMode("approve");
                                setProcessError(null);
                              }}
                              className="rounded-xl px-2.5 py-1 text-[11px] font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                              style={{
                                background: "linear-gradient(135deg, #3C7850 0%, #2F5D3A 100%)",
                                boxShadow: "0 2px 8px rgba(60,120,80,0.25)",
                              }}
                            >
                              Duyệt hoàn
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRequest(req);
                                setModalMode("reject");
                                setRejectReason("");
                                setProcessError(null);
                              }}
                              className="rounded-xl px-2.5 py-1 text-[11px] font-semibold transition-all hover:bg-rose-50 active:scale-95"
                              style={{
                                border: "1px solid rgba(239,68,68,0.3)",
                                color: "#DC2626",
                              }}
                            >
                              Từ chối
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px]" style={{ color: T.mutedLight }}>
                            {req.processedAt ? formatDateTimeVi(req.processedAt) : "—"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approve Confirmation Modal */}
      {selectedRequest && modalMode === "approve" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div
            className="relative w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}
          >
            <button
              onClick={() => {
                setSelectedRequest(null);
                setModalMode(null);
              }}
              className="absolute right-4 top-4 rounded-full p-2 text-stone-400 hover:bg-black/5"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className={dashboardTitleClass} style={{ color: T.text }}>
                  Xác nhận hoàn tiền vé
                </h3>
                <p className="text-xs" style={{ color: T.muted }}>
                  Mã vé: <strong className="font-mono text-amber-800">{selectedRequest.ticketCode}</strong>
                </p>
              </div>
            </div>

            <div
              className="rounded-2xl p-4 mb-4 space-y-2 text-xs"
              style={{ background: T.bg, border: `1px solid ${T.border}` }}
            >
              <div className="flex justify-between">
                <span style={{ color: T.muted }}>Số tiền hoàn:</span>
                <span className="font-bold text-amber-800 text-sm">
                  {formatVnd(selectedRequest.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: T.muted }}>Ngân hàng:</span>
                <span className="font-semibold" style={{ color: T.text }}>{selectedRequest.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: T.muted }}>Số tài khoản:</span>
                <span className="font-mono font-bold" style={{ color: T.primaryDark }}>{selectedRequest.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: T.muted }}>Chủ tài khoản:</span>
                <span className="font-semibold uppercase" style={{ color: T.text }}>{selectedRequest.accountHolderName}</span>
              </div>
            </div>

            <div className="mb-4 rounded-2xl bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
              ⚠️ <strong>Lưu ý:</strong> Vui lòng đảm bảo bạn đã hoàn tất lệnh chuyển khoản số tiền trên đến tài khoản người nhận. Khi bấm xác nhận, vé sẽ chuyển sang trạng thái <strong>Đã hoàn tiền</strong> và mã QR soát vé sẽ bị vô hiệu hóa ngay lập tức.
            </div>

            {processError && (
              <div className="mb-4 rounded-xl bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
                {processError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedRequest(null);
                  setModalMode(null);
                }}
                className="rounded-xl px-4 py-2 text-xs font-medium hover:bg-black/5"
                style={{ color: T.muted }}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleProcessSubmit}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white transition-transform active:scale-95 disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #3C7850 0%, #2F5D3A 100%)",
                  boxShadow: "0 4px 12px rgba(60,120,80,0.3)",
                }}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  "Xác nhận đã hoàn tiền"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {selectedRequest && modalMode === "reject" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div
            className="relative w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}
          >
            <button
              onClick={() => {
                setSelectedRequest(null);
                setModalMode(null);
              }}
              className="absolute right-4 top-4 rounded-full p-2 text-stone-400 hover:bg-black/5"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className={dashboardTitleClass} style={{ color: T.text }}>
                  Từ chối hoàn tiền vé
                </h3>
                <p className="text-xs" style={{ color: T.muted }}>
                  Mã vé: <strong className="font-mono text-rose-800">{selectedRequest.ticketCode}</strong>
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: T.muted }}>
                  Lý do từ chối *
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="VD: Thông tin tài khoản không trùng khớp, vé không thuộc diện hoàn tiền..."
                  required
                  className="w-full rounded-xl px-3.5 py-2.5 text-xs outline-none transition-all resize-none"
                  style={{
                    background: T.bg,
                    border: `1px solid ${T.border}`,
                    color: T.text,
                  }}
                />
              </div>

              <p className="text-[11px]" style={{ color: T.mutedLight }}>
                Vé sẽ được khôi phục về trạng thái <strong>Đã thanh toán</strong> để du khách có thể tiếp tục sử dụng để vào cổng.
              </p>

              {processError && (
                <div className="rounded-xl bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
                  {processError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRequest(null);
                    setModalMode(null);
                  }}
                  className="rounded-xl px-4 py-2 text-xs font-medium hover:bg-black/5"
                  style={{ color: T.muted }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleProcessSubmit}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white transition-transform active:scale-95 disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)",
                    boxShadow: "0 4px 12px rgba(220,38,38,0.3)",
                  }}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    "Xác nhận từ chối"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
