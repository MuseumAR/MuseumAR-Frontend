"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { Artifact } from "@/types";

export function UpdateArtifactForm({ artifact }: { artifact: Artifact }) {
  const imageRef = useRef<HTMLInputElement>(null);
  const arRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(artifact.image);
  const [arFileName, setArFileName] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setImagePreview(URL.createObjectURL(file));
  }

  function handleAr(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setArFileName(file.name);
  }

  function handleAudio(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setAudioFileName(file.name);
  }

  return (
    <div className="px-8 py-8">
      <Link
        href={`/content-manager/artifact/${artifact.id}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
      >
        <span>←</span> Back to Art
      </Link>

      <h1 className="mb-8 text-3xl font-semibold">Update new artifact</h1>

      <div className="rounded-2xl border border-white/25 p-8">
        <div className="flex gap-8">
          {/* Left — upload zones */}
          <div className="flex w-44 shrink-0 flex-col gap-3">
            <button
              type="button"
              onClick={() => imageRef.current?.click()}
              className="flex h-36 w-full flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl border border-dashed border-white/30 bg-white/5 text-center transition-colors hover:border-white/50"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="preview" className="h-full w-full object-cover" />
              ) : (
                <>
                  <UploadIcon />
                  <p className="text-xs text-white/50">Choose artifact image</p>
                </>
              )}
            </button>
            <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />

            <button
              type="button"
              onClick={() => arRef.current?.click()}
              className="flex h-20 w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/30 bg-white/5 transition-colors hover:border-white/50"
            >
              <UploadIcon />
              <p className="text-xs text-white/50">AR model</p>
            </button>
            <input ref={arRef} type="file" accept=".glb,.gltf" className="hidden" onChange={handleAr} />

            <button
              type="button"
              onClick={() => audioRef.current?.click()}
              className="flex h-20 w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/30 bg-white/5 transition-colors hover:border-white/50"
            >
              <UploadIcon />
              <p className="text-xs text-white/50">Audio</p>
            </button>
            <input ref={audioRef} type="file" accept="audio/*" className="hidden" onChange={handleAudio} />
          </div>

          {/* Right — form fields pre-filled */}
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Artifact Name" defaultValue={artifact.name} />
              <Field label="Category" defaultValue={artifact.category} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Era" defaultValue={artifact.era} />
              <Field label="Exhibition name" defaultValue="" placeholder="Exhibition name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Location" defaultValue={artifact.location} />
              <Field label="Tags" defaultValue="" placeholder="Tags" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FileDisplay label="AR Model" fileName={arFileName} />
              <FileDisplay label="Audio" fileName={audioFileName} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-white/60">Description</label>
              <textarea
                defaultValue={artifact.description}
                rows={4}
                className="w-full resize-none rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-white/40"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
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
  placeholder,
}: {
  label: string;
  defaultValue: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm text-white/60">{label}</label>
      <input
        type="text"
        defaultValue={defaultValue}
        placeholder={placeholder ?? label}
        className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-white/40"
      />
    </div>
  );
}

function FileDisplay({ label, fileName }: { label: string; fileName: string | null }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm text-white/60">{label}</label>
      <div className="flex w-full items-center rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm">
        {fileName ? (
          <span className="truncate text-white">{fileName}</span>
        ) : (
          <span className="text-white/30">No file chosen</span>
        )}
      </div>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg className="h-5 w-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}
