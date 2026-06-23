"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import { createTicketTypeEntry } from "@/services/admin";
import {
  getDisplayError,
  getFirstValidationError,
  validateCreateTicketType,
} from "@/lib/validation";
import type { MuseumDto, TicketTypeDto } from "@/types/api";

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(price);
}

export function TicketTypeManagementPanel({
  ticketTypes,
  museums,
}: {
  ticketTypes: TicketTypeDto[];
  museums: MuseumDto[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [museumId, setMuseumId] = useState(museums[0]?.id ?? 0);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [exhibitionId, setExhibitionId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const museumNameById = new Map(museums.map((m) => [m.id, m.name]));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validation = validateCreateTicketType({ museumId, name, price });
    if (!validation.valid) {
      setError(getFirstValidationError(validation));
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await createTicketTypeEntry({
        museumId,
        name: name.trim(),
        price: Number(price),
        description: description.trim() || undefined,
        exhibitionId: exhibitionId.trim() ? Number(exhibitionId) : undefined,
        isActive,
      });
      setShowForm(false);
      setName("");
      setPrice("");
      setDescription("");
      setExhibitionId("");
      setIsActive(true);
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Unable to create ticket type. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 px-8 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-2xl font-semibold" style={{ fontFamily: cinzel, color: T.text }}>
            {ticketTypes.length} ticket type{ticketTypes.length === 1 ? "" : "s"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          disabled={museums.length === 0}
          className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{
            background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
            color: T.surface,
          }}
        >
          <Plus className="h-4 w-4" />
          {showForm ? "Close form" : "Create ticket type"}
        </button>
      </div>

      {museums.length === 0 && (
        <p
          className="rounded-2xl px-4 py-3 text-sm"
          style={{ background: "rgba(200,155,69,0.10)", color: T.muted }}
        >
          Create at least one museum before adding ticket types.
        </p>
      )}

      {showForm && museums.length > 0 && (
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl p-6"
          style={{ background: T.surface, border: `1px solid ${T.border}` }}
        >
          <h2 className="mb-4 text-lg font-semibold" style={{ fontFamily: cinzel, color: T.text }}>
            New ticket type
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-sm" style={{ color: T.muted }}>
                Museum *
              </label>
              <select
                value={museumId}
                onChange={(e) => setMuseumId(Number(e.target.value))}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
              >
                {museums.map((museum) => (
                  <option key={museum.id} value={museum.id}>
                    {museum.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm" style={{ color: T.muted }}>
                Name *
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Adult ticket"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm" style={{ color: T.muted }}>
                Price (VND) *
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="50000"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm" style={{ color: T.muted }}>
                Exhibition ID (optional)
              </label>
              <input
                type="number"
                min="1"
                value={exhibitionId}
                onChange={(e) => setExhibitionId(e.target.value)}
                placeholder="Leave empty for museum-wide"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-sm" style={{ color: T.muted }}>
                Description
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
              />
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2" style={{ color: T.muted }}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Active
            </label>
          </div>

          {error && (
            <p
              className="mt-4 rounded-xl px-3 py-2 text-sm"
              style={{ background: "rgba(180,40,40,0.08)", color: "#8B2E2E" }}
            >
              {error}
            </p>
          )}

          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl px-6 py-2 text-sm font-medium disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
                color: T.surface,
              }}
            >
              {isSubmitting ? "Saving…" : "Create ticket type"}
            </button>
          </div>
        </form>
      )}

      <div
        className="overflow-hidden rounded-3xl"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        {ticketTypes.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm" style={{ color: T.muted }}>
              No ticket types yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr
                  style={{
                    borderBottom: `1px solid ${T.border}`,
                    background: "rgba(245,230,200,0.35)",
                  }}
                >
                  {["ID", "Name", "Museum", "Price", "Exhibition ID", "Description"].map(
                    (label) => (
                      <th
                        key={label}
                        className="px-5 py-4 font-medium"
                        style={{ color: T.mutedLight }}
                      >
                        {label}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {ticketTypes.map((ticket) => (
                  <tr
                    key={ticket.id}
                    style={{ borderBottom: `1px solid ${T.border}` }}
                    className="hover:bg-[rgba(200,155,69,0.05)]"
                  >
                    <td className="px-5 py-4 tabular-nums" style={{ color: T.text }}>
                      {ticket.id}
                    </td>
                    <td className="px-5 py-4 font-medium" style={{ color: T.text }}>
                      {ticket.name}
                    </td>
                    <td className="px-5 py-4" style={{ color: T.muted }}>
                      {museumNameById.get(ticket.museumId) ?? `#${ticket.museumId}`}
                    </td>
                    <td className="px-5 py-4 tabular-nums" style={{ color: T.text }}>
                      {formatPrice(ticket.price)}
                    </td>
                    <td className="px-5 py-4" style={{ color: T.muted }}>
                      {ticket.exhibitionId ?? "—"}
                    </td>
                    <td className="max-w-[200px] truncate px-5 py-4" style={{ color: T.muted }}>
                      {ticket.description ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
