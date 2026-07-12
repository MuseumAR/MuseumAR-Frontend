"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import { createTicketTypeEntry } from "@/services/ticket-manager";
import {
  getDisplayError,
  getFirstValidationError,
  validateCreateTicketType,
} from "@/lib/validation";

type TicketType = "standard" | "exhibition";
type TicketStatus = "Active" | "Inactive";

export function CreateTicketForm({ museumId }: { museumId: number | null }) {
  const router = useRouter();
  const [ticketType, setTicketType] = useState<TicketType>("standard");
  const [ticketName, setTicketName] = useState("");
  const [price, setPrice] = useState("");
  const [exhibitionId, setExhibitionId] = useState("");
  const [status, setStatus] = useState<TicketStatus>("Active");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreate = museumId != null && museumId > 0;

  async function handleSubmit() {
    if (museumId == null) {
      setError("Museum profile is not available.");
      return;
    }

    const validation = validateCreateTicketType({
      museumId,
      name: ticketName,
      price,
    });
    if (!validation.valid) {
      setError(getFirstValidationError(validation));
      return;
    }

    if (ticketType === "exhibition" && !exhibitionId.trim()) {
      setError("Exhibition ID is required for exhibition tickets");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await createTicketTypeEntry({
        museumId,
        name: ticketName.trim(),
        price: Number(price),
        description: description.trim() || undefined,
        exhibitionId:
          ticketType === "exhibition" ? Number(exhibitionId) : undefined,
        isActive: status === "Active",
      });

      router.push("/ticket-manager/ticket-management/overview");
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Failed to create ticket. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="px-8 py-8">
      <Link
        href="/ticket-manager/ticket-management/overview"
        className="mb-6 inline-flex items-center gap-2 text-sm transition-colors"
        style={{ color: T.muted }}
      >
        <span>←</span> Back to list
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-semibold" style={{ fontFamily: cinzel, color: T.text }}>
          Create new ticket
        </h1>
        <p className="mt-2 text-sm" style={{ color: T.muted }}>
          Create a standard (museum-wide) or exhibition ticket type
        </p>
      </div>

      {!canCreate && (
        <div
          className="mb-6 rounded-lg p-4 text-sm"
          style={{ background: "rgba(200,155,69,0.10)", color: T.muted }}
        >
          Museum profile is required before adding ticket types.
        </div>
      )}

      {error && (
        <div
          className="mb-6 rounded-lg p-4 text-sm"
          style={{
            background: "rgba(229,57,57,0.1)",
            border: `1px solid rgba(229,57,57,0.3)`,
            color: "#e53935",
          }}
        >
          {error}
        </div>
      )}

      <div
        className="space-y-6 rounded-3xl p-8"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        {/* Ticket Type Selection */}
        <div>
          <label className="block text-sm font-medium mb-3" style={{ color: T.text }}>
            Ticket Type
          </label>
          <div className="flex gap-4">
            {(["standard", "exhibition"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTicketType(type)}
                className="flex-1 rounded-lg px-4 py-3 text-sm font-medium transition-all"
                style={{
                  background: ticketType === type ? T.primary : T.surface,
                  color: ticketType === type ? T.surface : T.text,
                  border: `1px solid ${ticketType === type ? T.primary : T.border}`,
                }}
              >
                {type === "standard" ? "Standard Ticket" : "Exhibition Ticket"}
              </button>
            ))}
          </div>
        </div>

        {/* Ticket Name */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
            Ticket name
          </label>
          <input
            type="text"
            placeholder="e.g., Adult ticket"
            value={ticketName}
            onChange={(e) => setTicketName(e.target.value)}
            className="w-full rounded-lg px-4 py-3 outline-none text-sm"
            style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text }}
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
            Ticket price (VND)
          </label>
          <input
            type="number"
            min="0"
            step="1000"
            placeholder="50000"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-lg px-4 py-3 outline-none text-sm"
            style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text }}
          />
        </div>

        {/* Exhibition ID (exhibition tickets only) */}
        {ticketType === "exhibition" && (
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
              Exhibition Id
            </label>
            <input
              type="number"
              min="1"
              placeholder="1"
              value={exhibitionId}
              onChange={(e) => setExhibitionId(e.target.value)}
              className="w-full rounded-lg px-4 py-3 outline-none text-sm"
              style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text }}
            />
          </div>
        )}

        {/* Status */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
            Ticket Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TicketStatus)}
            className="w-full rounded-lg px-4 py-3 outline-none text-sm"
            style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text }}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
            Ticket description
          </label>
          <textarea
            placeholder="Optional description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-lg px-4 py-3 outline-none text-sm resize-none"
            style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text }}
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !canCreate}
            className="flex-1 rounded-lg px-6 py-3 font-medium transition-all disabled:opacity-50"
            style={{ background: T.primary, color: T.surface }}
          >
            {isSubmitting ? "Creating..." : "Create"}
          </button>
          <Link
            href="/ticket-manager/ticket-management/overview"
            className="flex-1 rounded-lg px-6 py-3 font-medium text-center transition-all"
            style={{ background: T.surface, color: T.text, border: `1px solid ${T.border}` }}
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
