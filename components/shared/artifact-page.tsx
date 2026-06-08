"use client";

import { PageHeader } from "@/components/dashboard/page-header";
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
      <PageHeader title="Artifact" icon="artifact" />
      <div className="px-8 py-8">
        {/* Toolbar */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="relative w-64">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
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
              placeholder="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-white/20 bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder-white/40 outline-none transition-colors focus:border-white/40"
            />
          </div>

          {createHref && (
            <Link
              href={createHref}
              className="text-sm text-white/60 transition-colors hover:text-white"
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
              className="flex gap-6 rounded-2xl border border-white/25 p-5 transition-colors hover:border-white/35"
            >
              {/* Image */}
              <div className="h-40 w-40 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-white/5">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white/20">
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
                    <h2 className="text-lg font-medium text-amber-400">{item.name}</h2>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="rounded-full border border-white/30 px-3 py-0.5 text-xs text-white/70 transition-colors hover:border-white/50"
                      >
                        {item.status === "Published" ? "Unpublish" : "Publish"}
                      </button>
                      <StatusBadge status={item.status} />
                    </div>
                  </div>

                  <p className="mt-1 text-sm text-white/50">ID: {item.id}</p>

                  <dl className="mt-3 space-y-1 text-sm">
                    <Row label="Category" value={item.category} />
                    <Row label="Era" value={item.era} />
                    <Row label="Location" value={item.location} />
                    <ActiveRow label="QR Linked" value={item.qrLinked} />
                    <ActiveRow label="AR Model" value={item.arModelStatus} />
                    <ActiveRow label="Audio" value={item.audio} />
                  </dl>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  {showDelete && (
                    <button
                      type="button"
                      className="rounded-full border border-red-500/50 px-4 py-1 text-xs text-red-400 transition-colors hover:bg-red-500/10"
                    >
                      Delete
                    </button>
                  )}
                  <Link
                    href={`${basePath}/artifact/${item.id}`}
                    className="rounded-full border border-white/25 px-4 py-1 text-xs text-white/60 transition-colors hover:border-white/50 hover:text-white"
                  >
                    View Detail
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <p className="py-12 text-center text-sm text-white/40">No artifacts found.</p>
          )}
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="text-white/50">{label}:</dt>
      <dd>{value}</dd>
    </div>
  );
}

function ActiveRow({ label, value }: { label: string; value: ActiveInactive }) {
  return (
    <div className="flex gap-2">
      <dt className="text-white/50">{label}:</dt>
      <dd className={value === "Active" ? "text-emerald-400" : "text-red-400"}>{value}</dd>
    </div>
  );
}

function StatusBadge({ status }: { status: Artifact["status"] }) {
  const styles = {
    Published: "border-emerald-500/50 text-emerald-400",
    Draft: "border-white/25 text-white/50",
    Pending: "border-amber-500/50 text-amber-400",
  };
  return (
    <span className={`rounded-full border px-3 py-0.5 text-xs ${styles[status]}`}>
      {status}
    </span>
  );
}
