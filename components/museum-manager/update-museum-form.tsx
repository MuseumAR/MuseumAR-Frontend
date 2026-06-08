"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { MuseumProfile } from "@/types";

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i.toString().padStart(2, "0");
  return `${h}:00`;
});

export function UpdateMuseumForm({ profile }: { profile: MuseumProfile }) {
  const [imagePreview, setImagePreview] = useState<string | null>(profile.image);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
  }

  return (
    <div className="px-8 py-8">
      <Link
        href="/museum-manager/museum-profile"
        className="mb-6 inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
      >
        <span>←</span> Back to list
      </Link>

      <h1 className="mb-8 text-3xl font-semibold">Update Museum</h1>

      <div className="rounded-2xl border border-white/25 p-8">
        <div className="flex gap-8">
          {/* Image upload */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-52 w-52 shrink-0 flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed border-white/30 bg-white/5 text-center transition-colors hover:border-white/50 hover:bg-white/10"
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <>
                <svg
                  className="h-6 w-6 text-white/40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm text-white/50">Choose Museum Image</p>
                <p className="text-xs text-white/30">choose image below 20mb</p>
              </>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />

          {/* Form fields — pre-filled with existing data */}
          <div className="flex-1 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Museum Name" defaultValue={profile.name} />
              <Field label="Address" defaultValue={profile.address} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Contact Email" defaultValue={profile.email} type="email" />
              <Field label="Phone Number" defaultValue={profile.phone} type="tel" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <SelectField label="Opening Hours" defaultValue={profile.openingHours} />
              <SelectField label="Closing Hours" defaultValue={profile.closingHours} />
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            className="rounded-lg border border-emerald-500 px-6 py-2 text-sm text-emerald-400 transition-colors hover:bg-emerald-500/10"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  defaultValue,
  type = "text",
}: {
  label: string;
  defaultValue: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm text-white/60">{label}</label>
      <input
        type={type}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-white/40"
      />
    </div>
  );
}

function SelectField({
  label,
  defaultValue,
}: {
  label: string;
  defaultValue: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm text-white/60">{label}</label>
      <select
        defaultValue={HOURS.includes(defaultValue) ? defaultValue : ""}
        className="w-full rounded-lg border border-white/20 bg-[#111] px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-white/40"
      >
        {!HOURS.includes(defaultValue) && (
          <option value="" disabled>
            {defaultValue}
          </option>
        )}
        {HOURS.map((h) => (
          <option key={h} value={h} className="bg-[#111] text-white">
            {h}
          </option>
        ))}
      </select>
    </div>
  );
}
