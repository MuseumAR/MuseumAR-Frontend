"use client";

import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import type { MuseumProfile } from "@/types";
import Link from "next/link";
import { useRef, useState } from "react";
import { getDisplayError } from "@/lib/validation";

const HOURS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}:00`);

export function UpdateMuseumForm({ profile }: { profile: MuseumProfile }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(profile.name);
  const [address, setAddress] = useState(profile.address);
  const [email, setEmail] = useState(profile.email === "—" ? "" : profile.email);
  const [phone, setPhone] = useState(profile.phone === "—" ? "" : profile.phone);
  const [openingHours, setOpeningHours] = useState(
    HOURS.includes(profile.openingHours) ? profile.openingHours : "",
  );
  const [closingHours, setClosingHours] = useState(
    HOURS.includes(profile.closingHours) ? profile.closingHours : "",
  );
  const [imagePreview, setImagePreview] = useState<string | null>(profile.image);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Museum name is required.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      setError(
        "Museum update is not available yet — the backend does not expose PUT /api/admin/museums/{id}.",
      );
    } catch (err) {
      setError(getDisplayError(err, "Unable to update museum."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="px-8 pb-10">
      <Link
        href="/museum-manager/museum-profile"
        className="mb-6 inline-flex items-center gap-2 text-sm"
        style={{ color: T.muted }}
      >
        <span>←</span> Back to profile
      </Link>
      <h1 className="mb-8 text-3xl font-semibold" style={{ fontFamily: cinzel, color: T.text }}>
        Update Museum
      </h1>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl p-8"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        <div className="flex flex-col gap-8 lg:flex-row">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-52 w-full shrink-0 flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed text-center lg:w-52"
            style={{ borderColor: T.border, background: "rgba(200,155,69,0.08)", color: T.muted }}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="preview" className="h-full w-full object-cover" />
            ) : (
              <>
                <p className="text-sm">Choose museum image</p>
                <p className="text-xs" style={{ color: T.mutedLight }}>below 20mb</p>
              </>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

          <div className="flex-1 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Museum name *" value={name} onChange={setName} />
              <Field label="Address" value={address} onChange={setAddress} />
              <Field label="Contact email" value={email} onChange={setEmail} type="email" />
              <Field label="Phone number" value={phone} onChange={setPhone} type="tel" />
              <SelectField label="Opening hours" value={openingHours} onChange={setOpeningHours} />
              <SelectField label="Closing hours" value={closingHours} onChange={setClosingHours} />
            </div>
            {error && (
              <p
                className="rounded-xl px-3 py-2 text-sm"
                style={{ background: "rgba(180,40,40,0.08)", color: "#8B2E2E" }}
              >
                {error}
              </p>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <Link
            href="/museum-manager/museum-profile"
            className="rounded-xl px-5 py-2 text-sm"
            style={{ border: `1px solid ${T.border}`, color: T.muted }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl px-6 py-2 text-sm font-medium disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
              color: T.surface,
            }}
          >
            {isSubmitting ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm" style={{ color: T.muted }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
        style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm" style={{ color: T.muted }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
        style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
      >
        <option value="">Select time</option>
        {HOURS.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
    </div>
  );
}
