"use client";

import { useState } from "react";
import { CheckCircle2, Search, Ticket } from "lucide-react";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import { repairDisplayText } from "@/lib/repair-text";
import { getDisplayError } from "@/lib/validation";
import {
  checkInTicket,
  validateTicket,
} from "@/services/visitor/ticketing-api.service";
import type { ValidateTicketResponseDto } from "@/types/api";

export function TicketCheckInPanel() {
  const [ticketCode, setTicketCode] = useState("");
  const [result, setResult] = useState<ValidateTicketResponseDto | null>(null);
  const [busy, setBusy] = useState<"validate" | "checkin" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleValidate(e: React.FormEvent) {
    e.preventDefault();
    const code = ticketCode.trim();
    if (!code) {
      setError("Nhập mã vé.");
      return;
    }
    setBusy("validate");
    setError(null);
    setResult(null);
    try {
      const data = await validateTicket(code);
      setResult(data);
    } catch (err) {
      setError(getDisplayError(err, "Không thể xử lý mã vé."));
    } finally {
      setBusy(null);
    }
  }

  async function handleCheckIn() {
    const code = ticketCode.trim();
    if (!code) return;
    setBusy("checkin");
    setError(null);
    try {
      const data = await checkInTicket({ ticketCode: code });
      setResult(data);
    } catch (err) {
      setError(getDisplayError(err, "Không thể xử lý mã vé."));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      className="rounded-3xl p-6"
      style={{ background: T.surface, border: `1px solid ${T.border}` }}
    >
      <div className="mb-4 flex items-center gap-2">
        <Ticket className="h-5 w-5" style={{ color: T.primaryDark }} />
        <h2 className="text-lg font-semibold" style={{ fontFamily: cinzel, color: T.text }}>
          Check-in vé
        </h2>
      </div>
      <p className="mb-4 text-sm" style={{ color: T.muted }}>
        Quét hoặc nhập mã vé để xác thực, rồi check-in khi khách vào cửa.
      </p>

      <form onSubmit={handleValidate} className="flex flex-wrap gap-3">
        <input
          value={ticketCode}
          onChange={(e) => setTicketCode(e.target.value)}
          placeholder="VD: TK-260808-1234-01"
          className="min-w-[240px] flex-1 rounded-xl px-4 py-2.5 text-sm outline-none"
          style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
        />
        <button
          type="submit"
          disabled={busy != null}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-50"
          style={{
            background: T.bg,
            border: `1px solid ${T.border}`,
            color: T.text,
          }}
        >
          <Search className="h-4 w-4" />
          {busy === "validate" ? "Đang kiểm tra…" : "Validate"}
        </button>
        <button
          type="button"
          disabled={busy != null || !ticketCode.trim()}
          onClick={() => void handleCheckIn()}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-50"
          style={{
            background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
            color: T.surface,
          }}
        >
          <CheckCircle2 className="h-4 w-4" />
          {busy === "checkin" ? "Đang check-in…" : "Check-in"}
        </button>
      </form>

      {error && (
        <p className="mt-3 text-sm" style={{ color: "#8B2E2E" }}>
          {repairDisplayText(error)}
        </p>
      )}

      {result && (
        <div
          className="mt-4 grid gap-2 rounded-2xl p-4 text-sm sm:grid-cols-2"
          style={{
            background: result.isValid
              ? "rgba(79,125,74,0.08)"
              : "rgba(184,92,56,0.08)",
            border: `1px solid ${
              result.isValid ? "rgba(79,125,74,0.25)" : "rgba(184,92,56,0.25)"
            }`,
          }}
        >
          <p className="sm:col-span-2 font-medium" style={{ color: T.text }}>
            {repairDisplayText(result.message)}
          </p>
          <p style={{ color: T.muted }}>
            Mã: <span style={{ color: T.text }}>{result.ticketCode}</span>
          </p>
          <p style={{ color: T.muted }}>
            Trạng thái: <span style={{ color: T.text }}>{result.status}</span>
          </p>
          <p style={{ color: T.muted }}>
            Loại vé: <span style={{ color: T.text }}>{repairDisplayText(result.ticketTypeName)}</span>
          </p>
          <p style={{ color: T.muted }}>
            Khách: <span style={{ color: T.text }}>{repairDisplayText(result.visitorName)}</span>
          </p>
          {result.usedAt && (
            <p className="sm:col-span-2" style={{ color: T.muted }}>
              Used at: <span style={{ color: T.text }}>{result.usedAt}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
