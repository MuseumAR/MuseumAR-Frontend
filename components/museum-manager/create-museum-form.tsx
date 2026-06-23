"use client";

import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { registerMuseum } from "@/services/museum-manager";
import {
  getDisplayError,
  getFirstValidationError,
  validateCreateMuseum,
} from "@/lib/validation";

export function CreateMuseumForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validation = validateCreateMuseum({ name, email, phone });
    if (!validation.valid) {
      setError(getFirstValidationError(validation));
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await registerMuseum({
        name: name.trim(),
        description: description.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        province: province.trim() || undefined,
        contactEmail: email.trim() || undefined,
        contactPhone: phone.trim() || undefined,
      });
      router.push("/museum-manager/museum-profile");
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Unable to register museum. Please try again."));
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
        Register Museum
      </h1>

      <form
        onSubmit={handleSubmit}
        className="max-w-3xl rounded-3xl p-8"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Museum name *" value={name} onChange={setName} placeholder="Museum name" className="sm:col-span-2" />
          <Field label="Description" value={description} onChange={setDescription} placeholder="Short description" className="sm:col-span-2" />
          <Field label="Address" value={address} onChange={setAddress} placeholder="Street address" />
          <Field label="City" value={city} onChange={setCity} placeholder="Hà Nội" />
          <Field label="Province" value={province} onChange={setProvince} placeholder="Hà Nội" />
          <Field label="Contact email" value={email} onChange={setEmail} placeholder="email@museum.vn" type="email" />
          <Field label="Contact phone" value={phone} onChange={setPhone} placeholder="Phone number" type="tel" />
        </div>

        {error && (
          <p
            className="mt-5 rounded-xl px-3 py-2 text-sm"
            style={{ background: "rgba(180,40,40,0.08)", color: "#8B2E2E" }}
          >
            {error}
          </p>
        )}

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl px-6 py-2 text-sm font-medium disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
              color: T.surface,
            }}
          >
            {isSubmitting ? "Submitting…" : "Register museum"}
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
  placeholder,
  type = "text",
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-sm" style={{ color: T.muted }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
        style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
      />
    </div>
  );
}
