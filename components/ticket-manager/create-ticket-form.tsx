"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";

type TicketType = "standard" | "exhibition";
type TicketStatus = "Active" | "Inactive";

export function CreateTicketForm() {
  const router = useRouter();
  const [ticketType, setTicketType] = useState<TicketType>("standard");
  const [ticketName, setTicketName] = useState("");
  const [price, setPrice] = useState("");
  const [visitorType, setVisitorType] = useState("");
  const [exhibitionId, setExhibitionId] = useState("");
  const [maxTicket, setMaxTicket] = useState("");
  const [maxQuantity, setMaxQuantity] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [status, setStatus] = useState<TicketStatus>("Active");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!ticketName.trim()) {
      setError("Ticket name is required");
      return;
    }
    if (!price.trim()) {
      setError("Price is required");
      return;
    }
    if (ticketType === "standard" && !visitorType.trim()) {
      setError("Visitor type is required for standard tickets");
      return;
    }
    if (ticketType === "exhibition" && !exhibitionId.trim()) {
      setError("Exhibition ID is required for exhibition tickets");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      // For now, just show success message and redirect
      // In a real app, this would call the API
      console.log({
        ticketType,
        ticketName,
        price: parseInt(price),
        visitorType: ticketType === "standard" ? visitorType : undefined,
        exhibitionId: ticketType === "exhibition" ? parseInt(exhibitionId) : undefined,
        maxTicket: ticketType === "exhibition" ? parseInt(maxTicket) : undefined,
        maxQuantity: ticketType === "exhibition" ? parseInt(maxQuantity) : undefined,
        validFrom,
        validUntil,
        status,
        description,
      });

      router.push("/ticket-manager/ticket-management/overview");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create ticket");
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
          Create standard ticket or exhibition ticket
        </p>
      </div>

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
        style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
        }}
      >
        {/* Ticket Type Selection */}
        <div>
          <label className="block text-sm font-medium mb-3" style={{ color: T.text }}>
            Ticket Type
          </label>
          <div className="flex gap-4">
            {["standard", "exhibition"].map((type) => (
              <button
                key={type}
                onClick={() => setTicketType(type as TicketType)}
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
            placeholder="e.g., StdA13, ExhA1"
            value={ticketName}
            onChange={(e) => setTicketName(e.target.value)}
            className="w-full rounded-lg px-4 py-3 outline-none text-sm"
            style={{
              background: "rgba(0,0,0,0.2)",
              border: `1px solid ${T.border}`,
              color: T.text,
            }}
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
            Ticket price
          </label>
          <input
            type="number"
            placeholder="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-lg px-4 py-3 outline-none text-sm"
            style={{
              background: "rgba(0,0,0,0.2)",
              border: `1px solid ${T.border}`,
              color: T.text,
            }}
          />
        </div>

        {/* Conditional Fields */}
        {ticketType === "standard" ? (
          <>
            {/* Visitor Type */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                Visitor Type
              </label>
              <input
                type="text"
                placeholder="e.g., Age 0-5, Age > 60, Disable"
                value={visitorType}
                onChange={(e) => setVisitorType(e.target.value)}
                className="w-full rounded-lg px-4 py-3 outline-none text-sm"
                style={{
                  background: "rgba(0,0,0,0.2)",
                  border: `1px solid ${T.border}`,
                  color: T.text,
                }}
              />
            </div>
          </>
        ) : (
          <>
            {/* Exhibition ID */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                Exhibition Id
              </label>
              <input
                type="number"
                placeholder="1"
                value={exhibitionId}
                onChange={(e) => setExhibitionId(e.target.value)}
                className="w-full rounded-lg px-4 py-3 outline-none text-sm"
                style={{
                  background: "rgba(0,0,0,0.2)",
                  border: `1px solid ${T.border}`,
                  color: T.text,
                }}
              />
            </div>

            {/* Max Ticket */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                Max Ticket
              </label>
              <input
                type="number"
                placeholder="1"
                value={maxTicket}
                onChange={(e) => setMaxTicket(e.target.value)}
                className="w-full rounded-lg px-4 py-3 outline-none text-sm"
                style={{
                  background: "rgba(0,0,0,0.2)",
                  border: `1px solid ${T.border}`,
                  color: T.text,
                }}
              />
            </div>

            {/* Max Quantity */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
                Max Quantity
              </label>
              <input
                type="number"
                placeholder="100"
                value={maxQuantity}
                onChange={(e) => setMaxQuantity(e.target.value)}
                className="w-full rounded-lg px-4 py-3 outline-none text-sm"
                style={{
                  background: "rgba(0,0,0,0.2)",
                  border: `1px solid ${T.border}`,
                  color: T.text,
                }}
              />
            </div>
          </>
        )}

        {/* Valid From Date */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
            Valid From Date
          </label>
          <input
            type="date"
            value={validFrom}
            onChange={(e) => setValidFrom(e.target.value)}
            className="w-full rounded-lg px-4 py-3 outline-none text-sm"
            style={{
              background: "rgba(0,0,0,0.2)",
              border: `1px solid ${T.border}`,
              color: T.text,
            }}
          />
        </div>

        {/* Valid Until Date */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
            Valid Until Date
          </label>
          <input
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className="w-full rounded-lg px-4 py-3 outline-none text-sm"
            style={{
              background: "rgba(0,0,0,0.2)",
              border: `1px solid ${T.border}`,
              color: T.text,
            }}
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>
            Ticket Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TicketStatus)}
            className="w-full rounded-lg px-4 py-3 outline-none text-sm"
            style={{
              background: "rgba(0,0,0,0.2)",
              border: `1px solid ${T.border}`,
              color: T.text,
            }}
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
            placeholder="Ticket description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-lg px-4 py-3 outline-none text-sm resize-none"
            style={{
              background: "rgba(0,0,0,0.2)",
              border: `1px solid ${T.border}`,
              color: T.text,
            }}
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 rounded-lg px-6 py-3 font-medium transition-all"
            style={{
              background: T.primary,
              color: T.surface,
              opacity: isSubmitting ? 0.6 : 1,
            }}
          >
            {isSubmitting ? "Creating..." : "Create"}
          </button>
          <Link
            href="/ticket-manager/ticket-management/overview"
            className="flex-1 rounded-lg px-6 py-3 font-medium text-center transition-all"
            style={{
              background: T.surface,
              color: T.text,
              border: `1px solid ${T.border}`,
            }}
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
