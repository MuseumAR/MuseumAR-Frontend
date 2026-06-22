"use client";

import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { createMuseumEntry } from "@/services/admin";

const HOURS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}:00`);

export function CreateMuseumForm() {
  const router = useRouter();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setError("Museum name is required");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await createMuseumEntry({
        name,
        address: address || undefined,
        contactEmail: email || undefined,
        contactPhone: phone || undefined,
      });
      router.push("/museum-manager/museum-profile");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create museum");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="px-8 pb-10">
      <Link href="/museum-manager/museum-profile" className="mb-6 inline-flex items-center gap-2 text-sm" style={{ color: T.muted }}><span>←</span> Back to list</Link>
      <h1 className="mb-8 text-3xl font-semibold" style={{ fontFamily: cinzel, color: T.text }}>Create New Museum</h1>

      <div className="rounded-3xl p-8" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        <div className="flex gap-8">
          <button type="button" onClick={() => fileRef.current?.click()} className="flex h-52 w-52 shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed text-center" style={{ borderColor: T.border, background: "rgba(200,155,69,0.08)", color: T.muted }}>
            {imagePreview ? <img src={imagePreview} alt="preview" className="h-full w-full rounded-2xl object-cover" /> : <><p className="text-sm">Choose Museum Image</p><p className="text-xs" style={{ color: T.mutedLight }}>below 20mb</p></>}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

          <div className="flex-1 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Museum Name" value={name} onChange={setName} placeholder="Museum Name" />
              <Field label="Address" value={address} onChange={setAddress} placeholder="Address" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Contact Email" value={email} onChange={setEmail} placeholder="Contact Email" type="email" />
              <Field label="Phone Number" value={phone} onChange={setPhone} placeholder="Phone Number" type="tel" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <SelectField label="Opening Hours" />
              <SelectField label="Closing Hours" />
            </div>
            {error && (
              <p className="rounded-xl px-3 py-2 text-sm" style={{ background: "rgba(180,40,40,0.08)", color: "#8B2E2E" }}>{error}</p>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="rounded-xl px-6 py-2 text-sm font-medium disabled:opacity-50"
            style={{ background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`, color: T.surface }}
          >
            {isSubmitting ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm" style={{ color: T.muted }}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl px-4 py-2.5 text-sm outline-none" style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }} />
    </div>
  );
}

function SelectField({ label }: { label: string }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm" style={{ color: T.muted }}>{label}</label>
      <select defaultValue="" className="w-full rounded-xl px-4 py-2.5 text-sm outline-none" style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}>
        <option value="" disabled>Choose hours</option>
        {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
      </select>
    </div>
  );
}
