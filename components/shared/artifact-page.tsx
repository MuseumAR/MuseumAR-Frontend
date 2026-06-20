"use client";

import { PageDescription } from "@/components/dashboard/page-header";
import { dashboardTheme as T } from "@/lib/dashboard-theme";
import { ARTIFACT_LABELS } from "@/lib/field-labels";
import type { Artifact, ActiveInactive } from "@/types";
import Link from "next/link";
import { useState } from "react";

interface Props {
  artifacts: Artifact[];
  basePath: string;
  createHref?: string;
  showDelete?: boolean;
}

export function ArtifactPageContent({ artifacts, basePath, createHref, showDelete }: Props) {
  const [search, setSearch] = useState("");

  const filtered = artifacts.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="px-8 pb-10">
        <PageDescription>
          Museum catalog with status and metadata
        </PageDescription>
        {/* Toolbar */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="relative w-64 max-w-full">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: T.mutedLight }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search artifacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl py-2.5 pl-9 pr-4 text-sm outline-none transition-colors"
              style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                color: T.text,
              }}
            />
          </div>

          {createHref && (
            <Link
              href={createHref}
              className="rounded-2xl px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
              style={{
                background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
                color: T.surface,
              }}
            >
              Create new artifact
            </Link>
          )}
        </div>

        {/* Cards */}
        <div className="space-y-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="flex gap-6 rounded-3xl p-5 transition-colors"
              style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                boxShadow: "0 6px 20px rgba(43,29,14,0.05)",
              }}
            >
              {/* Image */}
              <div
                className="h-40 w-40 shrink-0 overflow-hidden rounded-2xl"
                style={{
                  border: `1px solid ${T.border}`,
                  background: "rgba(200,155,69,0.08)",
                }}
              >
                {item.image ? (
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center" style={{ color: T.mutedLight }}>
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <h2 className="text-lg font-semibold" style={{ color: T.primaryDark }}>{item.name}</h2>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="rounded-full px-3 py-0.5 text-xs transition-colors"
                        style={{
                          border: `1px solid ${T.border}`,
                          color: T.muted,
                          background: "rgba(200,155,69,0.08)",
                        }}
                      >
                        {item.status === "Published" ? "Unpublish" : "Publish"}
                      </button>
                      <StatusBadge status={item.status} />
                    </div>
                  </div>

                  <p className="mt-1 text-sm" style={{ color: T.muted }}>ID: {item.id}</p>

                  <dl className="mt-3 space-y-1 text-sm">
                    <Row label={ARTIFACT_LABELS.category!} value={item.category} />
                    <Row label={ARTIFACT_LABELS.era!} value={item.era} />
                    <Row label={ARTIFACT_LABELS.location!} value={item.location} />
                    <ActiveRow label={ARTIFACT_LABELS.qrLinked!} value={item.qrLinked} />
                    <ActiveRow label={ARTIFACT_LABELS.arModelStatus!} value={item.arModelStatus} />
                    <ActiveRow label={ARTIFACT_LABELS.audio!} value={item.audio} />
                  </dl>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  {showDelete && (
                    <button
                      type="button"
                      className="rounded-full px-4 py-1 text-xs transition-colors"
                      style={{
                        border: `1px solid rgba(180,83,9,0.35)`,
                        color: T.danger,
                        background: "rgba(180,83,9,0.07)",
                      }}
                    >
                      Delete
                    </button>
                  )}
                  <Link
                    href={`${basePath}/artifact/${item.id}`}
                    className="rounded-full px-4 py-1 text-xs font-medium transition-colors"
                    style={{
                      border: `1px solid ${T.border}`,
                      color: T.muted,
                    }}
                  >
                    View Detail
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <p className="py-12 text-center text-sm" style={{ color: T.muted }}>
              No artifacts found.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt style={{ color: T.mutedLight }}>{label}:</dt>
      <dd style={{ color: T.text }}>{value}</dd>
    </div>
  );
}

function ActiveRow({ label, value }: { label: string; value: ActiveInactive }) {
  return (
    <div className="flex gap-2">
      <dt style={{ color: T.mutedLight }}>{label}:</dt>
      <dd className={value === "Active" ? "text-emerald-400" : "text-red-400"}>{value}</dd>
    </div>
  );
}

function StatusBadge({ status }: { status: Artifact["status"] }) {
  const styles = {
    Published: "border-[rgba(79,125,74,0.35)] bg-[rgba(79,125,74,0.1)] text-[#4F7D4A]",
    Draft: "border-[rgba(154,111,31,0.28)] bg-[rgba(200,155,69,0.13)] text-[#9A6F1F]",
    Pending: "border-[rgba(180,83,9,0.30)] bg-[rgba(180,83,9,0.08)] text-[#B45309]",
  };
  return (
    <span className={`rounded-full border px-3 py-0.5 text-xs ${styles[status]}`}>
      {status}
    </span>
  );
}
