"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import type { Ticket } from "@/types";
import { getExhibitionList } from "@/services/content-manager/exhibition.service";
import type { ExhibitionDto } from "@/types/api";
import {
  createTicketTypeEntryForManager,
  publishTicketTypeEntryForManager,
} from "@/services/museum-manager/ticket.service";
import {
  getDisplayError,
  getFirstValidationError,
  validateCreateTicketType,
} from "@/lib/validation";

export function TicketApplicationTable({
  tickets,
  museumId,
  museumName,
}: {
  tickets: Ticket[];
  museumId: number | null;
  museumName?: string | null;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [exhibitionId, setExhibitionId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublishing, setIsPublishing] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [exhibitions, setExhibitions] = useState<ExhibitionDto[]>([]);

  useEffect(() => {
    if (museumId) {
      getExhibitionList().then((list) => {
        const filtered = list.filter((ex) => ex.museumId === museumId);
        setExhibitions(filtered);
      });
    }
  }, [museumId]);

  const canCreate = museumId != null && museumId > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (museumId == null) {
      setError("Museum profile is not available.");
      return;
    }

    const validation = validateCreateTicketType({ museumId, name, price });
    if (!validation.valid) {
      setError(getFirstValidationError(validation));
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await createTicketTypeEntryForManager({
        museumId,
        name: name.trim(),
        price: Number(price),
        description: description.trim() || undefined,
        exhibitionId: exhibitionId.trim() ? Number(exhibitionId) : undefined,
        isActive: true,
      });
      setShowForm(false);
      setName("");
      setPrice("");
      setDescription("");
      setExhibitionId("");
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Unable to create ticket type. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePublish(ticketId: string) {
    const numericId = Number(ticketId.replace("TK-", ""));
    if (Number.isNaN(numericId)) return;

    setIsPublishing((prev) => ({ ...prev, [ticketId]: true }));
    setError(null);

    try {
      await publishTicketTypeEntryForManager(numericId);
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Unable to publish ticket type. Please try again."));
    } finally {
      setIsPublishing((prev) => ({ ...prev, [ticketId]: false }));
    }
  }

  return (
    <div className="space-y-6 px-8 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm" style={{ fontFamily: cinzel, color: T.muted }}>
          <span className="font-semibold" style={{ color: T.text }}>
            {tickets.length}
          </span>
          {` ticket type${tickets.length === 1 ? "" : "s"}`}
          {museumName ? (
            <span style={{ color: T.mutedLight }}>{` · ${museumName}`}</span>
          ) : null}
        </p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          disabled={!canCreate}
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

      {!canCreate && (
        <p
          className="rounded-2xl px-4 py-3 text-sm"
          style={{ background: "rgba(200,155,69,0.10)", color: T.muted }}
        >
          Museum profile is required before adding ticket types.
        </p>
      )}

      {showForm && canCreate && (
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
                Exhibition (optional)
              </label>
              <select
                value={exhibitionId}
                onChange={(e) => setExhibitionId(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
              >
                <option value="">Museum-wide (All exhibitions)</option>
                {exhibitions.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name || `Exhibition #${ex.id}`}
                  </option>
                ))}
              </select>
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
        {tickets.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm" style={{ color: T.muted }}>
              No ticket types yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr
                  style={{
                    borderBottom: `1px solid ${T.border}`,
                    background: "rgba(245,230,200,0.35)",
                  }}
                >
                  <th className="px-5 py-4 font-medium" style={{ color: T.mutedLight }}>
                    ID
                  </th>
                  <th className="px-5 py-4 font-medium" style={{ color: T.mutedLight }}>
                    Type
                  </th>
                  <th className="px-5 py-4 font-medium" style={{ color: T.mutedLight }}>
                    Price
                  </th>
                  <th className="px-5 py-4 font-medium" style={{ color: T.mutedLight }}>
                    Status
                  </th>
                  <th className="px-5 py-4 font-medium" style={{ color: T.mutedLight }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    style={{ borderBottom: `1px solid ${T.border}` }}
                    className="hover:bg-[rgba(200,155,69,0.05)]"
                  >
                    <td className="px-5 py-4" style={{ color: T.text }}>
                      {ticket.id}
                    </td>
                    <td className="px-5 py-4" style={{ color: T.text }}>
                      {ticket.type}
                    </td>
                    <td className="px-5 py-4" style={{ color: T.muted }}>
                      {ticket.price}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          background:
                            ticket.status === "Active"
                              ? "rgba(79,125,74,0.12)"
                              : "rgba(200,155,69,0.15)",
                          color: ticket.status === "Active" ? T.success : T.primaryDark,
                        }}
                      >
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {ticket.status === "Pending" && (
                        <button
                          type="button"
                          onClick={() => handlePublish(ticket.id)}
                          disabled={isPublishing[ticket.id]}
                          className="rounded-xl px-3 py-1 text-xs font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                          style={{
                            background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
                            color: T.surface,
                          }}
                        >
                          {isPublishing[ticket.id] ? "Publishing…" : "Publish"}
                        </button>
                      )}
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
