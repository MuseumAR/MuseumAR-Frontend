"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import {
  getDisplayError,
  getFirstValidationError,
  validateCreateArtifact,
} from "@/lib/validation";
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

  const [title, setTitle] = useState(artifact.name);
  const [exhibitCode, setExhibitCode] = useState(
    artifact.id.startsWith("EX-") ? "" : artifact.id,
  );
  const [description, setDescription] = useState(artifact.description);
  const [languageCode, setLanguageCode] = useState("vi");
  const [imagePreview, setImagePreview] = useState<string | null>(artifact.image);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [arFile, setArFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exhibitId =
    artifact.exhibitId ?? Number(artifact.id.replace(/^EX-/i, ""));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validation = validateCreateArtifact({ name: title });
    if (!validation.valid) {
      setError(getFirstValidationError(validation));
      return;
    }

    if (!exhibitId || Number.isNaN(exhibitId)) {
      setError("Unable to find this exhibit.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await updateExhibit(exhibitId, {
        museumId,
        exhibitCode: exhibitCode.trim() || undefined,
        status: artifact.status === "Published" ? "Published" : "Draft",
        translations: [
          {
            exhibitId,
            languageCode,
            title: title.trim(),
            description: description.trim() || undefined,
          },
        ],
      });

      if (imageFile) await uploadExhibitImage(exhibitId, imageFile, title.trim());
      if (audioFile) await uploadExhibitAudio(exhibitId, languageCode, audioFile);
      if (arFile) await uploadArAsset(exhibitId, "model", arFile);

      router.push(`/content-manager/artifact/${artifact.id}`);
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Unable to update exhibit."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="px-8 pb-10">
      <Link
        href={`/content-manager/artifact/${artifact.id}`}
        className="mb-6 inline-flex items-center gap-2 text-sm"
        style={{ color: T.muted }}
      >
        <span>←</span> Back to exhibit
      </Link>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold" style={{ fontFamily: cinzel, color: T.text }}>
          Update Exhibit
        </h1>
        <StatusBadge status={artifact.status} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl p-8"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="flex w-full shrink-0 flex-col gap-3 lg:w-48">
            <UploadBox
              label={imageFile?.name ?? "Image"}
              preview={imagePreview}
              onClick={() => imageRef.current?.click()}
            />
            <input
              ref={imageRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setImageFile(file);
                setImagePreview(URL.createObjectURL(file));
              }}
            />
            <UploadBox
              label={arFile?.name ?? "AR model"}
              onClick={() => arRef.current?.click()}
            />
            <input
              ref={arRef}
              type="file"
              accept=".glb,.gltf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setArFile(file);
              }}
            />
            <UploadBox
              label={audioFile?.name ?? "Audio guide"}
              onClick={() => audioRef.current?.click()}
            />
            <input
              ref={audioRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setAudioFile(file);
              }}
            />
          </div>

          <div className="flex-1 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Title *"
                value={title}
                onChange={setTitle}
                placeholder="Exhibit title"
              />
              <Field
                label="Exhibit code"
                value={exhibitCode}
                onChange={setExhibitCode}
                placeholder="CAT-001"
              />
              <Field
                label="Language"
                value={languageCode}
                onChange={setLanguageCode}
                placeholder="vi"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm" style={{ color: T.muted }}>
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full resize-none rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
              />
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
            href={`/content-manager/artifact/${artifact.id}`}
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
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm" style={{ color: T.muted }}>
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
        style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
      />
    </div>
  );
}

function UploadBox({
  label,
  preview,
  onClick,
}: {
  label: string;
  preview?: string | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[5rem] w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border border-dashed px-2 py-3 text-center text-xs"
      style={{ borderColor: T.border, background: "rgba(200,155,69,0.08)", color: T.muted }}
    >
      {preview ? (
        <img src={preview} alt="" className="h-full max-h-24 w-full object-cover" />
      ) : (
        label
      )}
    </button>
  );
}

function StatusBadge({ status }: { status: Artifact["status"] }) {
  const styles = {
    Published: { bg: "rgba(79,125,74,0.12)", color: T.success },
    Draft: { bg: "rgba(200,155,69,0.15)", color: T.primaryDark },
    Pending: { bg: "rgba(109,90,69,0.12)", color: T.muted },
  };
  const s = styles[status];
  return (
    <span
      className="rounded-full px-3 py-1 text-xs font-medium"
      style={{ background: s.bg, color: s.color }}
    >
      {status}
    </span>
  );
}
