"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { getDisplayError } from "@/lib/validation";
import type { Artifact } from "@/types";
import {
  updateExhibit,
  uploadArAsset,
  uploadExhibitAudio,
  uploadExhibitImage,
} from "@/services/content-manager";

export function UpdateArtifactForm({
  artifact,
  museumId,
}: {
  artifact: Artifact;
  museumId: number;
}) {
  const router = useRouter();
  const imageRef = useRef<HTMLInputElement>(null);
  const arRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(artifact.name);
  const [category, setCategory] = useState(artifact.category);
  const [era, setEra] = useState(artifact.era);
  const [location, setLocation] = useState(artifact.location);
  const [description, setDescription] = useState(artifact.description);
  const [imagePreview, setImagePreview] = useState<string | null>(artifact.image);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [arFile, setArFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exhibitId =
    artifact.exhibitId ?? Number(artifact.id.replace(/^EX-/i, ""));

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function handleAr(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setArFile(file);
  }

  function handleAudio(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setAudioFile(file);
  }

  async function handleSubmit() {
    if (!exhibitId || Number.isNaN(exhibitId)) {
      setError("Unable to find this artifact.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await updateExhibit(exhibitId, {
        museumId,
        exhibitCode: category !== "—" ? category : undefined,
        status: artifact.status === "Published" ? "Published" : "Draft",
        translations: [
          {
            exhibitId,
            languageCode: "vi",
            title: name,
            description,
          },
        ],
      });

      if (imageFile) {
        await uploadExhibitImage(exhibitId, imageFile, name);
      }
      if (audioFile) {
        await uploadExhibitAudio(exhibitId, "vi", audioFile);
      }
      if (arFile) {
        await uploadArAsset(exhibitId, "model", arFile);
      }

      router.push(`/content-manager/artifact/${artifact.id}`);
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Unable to update artifact. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="px-8 py-8">
      <Link
        href={`/content-manager/artifact/${artifact.id}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
      >
        <span>←</span> Back to Art
      </Link>

      <h1 className="mb-8 text-3xl font-semibold">Update artifact</h1>

      <div className="rounded-2xl border border-white/25 p-8">
        <div className="flex gap-8">
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
              <p className="text-xs text-white/50">{arFile?.name ?? "AR model"}</p>
            </button>
            <input ref={arRef} type="file" accept=".glb,.gltf" className="hidden" onChange={handleAr} />

            <button
              type="button"
              onClick={() => audioRef.current?.click()}
              className="flex h-20 w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/30 bg-white/5 transition-colors hover:border-white/50"
            >
              <UploadIcon />
              <p className="text-xs text-white/50">{audioFile?.name ?? "Audio"}</p>
            </button>
            <input ref={audioRef} type="file" accept="audio/*" className="hidden" onChange={handleAudio} />
          </div>

          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Artifact Name" value={name} onChange={setName} />
              <Field label="Category" value={category} onChange={setCategory} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Era" value={era} onChange={setEra} />
              <Field label="Location" value={location} onChange={setLocation} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-white/60">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full resize-none rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-white/40"
              />
            </div>
            {error && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="rounded-lg border border-emerald-500 px-6 py-2 text-sm text-emerald-400 transition-colors hover:bg-emerald-500/10 disabled:opacity-50"
          >
            {isSubmitting ? "Updating..." : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm text-white/60">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-white/40"
      />
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
