"use client";

import { PageHeader } from "@/components/dashboard/page-header";
import type { ExhibitionApplication } from "@/types";
import Link from "next/link";
import { useState } from "react";

export function ExhibitionApplicationDetail({
  application,
}: {
  application: ExhibitionApplication;
}) {
  const [reason, setReason] = useState("");

  return (
    <>
      <PageHeader title="Exhibition Detail" icon="exhibition_application" />
      <div className="px-8 py-8">
        <Link
          href="/museum-manager/exhibition-application"
          className="mb-6 inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
        >
          <span>←</span> Back to list
        </Link>

        <div className="rounded-2xl border border-white/25 p-6">
          <div className="flex gap-8">
            {/* Left — info */}
            <div className="flex-1 space-y-3">
              {/* Status badges */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-full border border-white/30 px-3 py-0.5 text-xs text-white/70 transition-colors hover:border-white/50"
                >
                  {application.status === "Approved" ? "Unpublish" : "Publish"}
                </button>
                <StatusBadge status={application.status} />
              </div>

              <dl className="space-y-2 text-sm">
                <Row label="Name" value={application.title} />
                <Row label="Exhibition Type" value={application.exhibitionType} />
                <Row
                  label="Date start"
                  value={`${application.dateStart} - Date end: ${application.dateEnd}`}
                />
                <Row
                  label="Opening hours"
                  value={`${application.openingHours} - Closing hours: ${application.closingHours}`}
                />
                <Row label="Contact Email" value={application.contactEmail} />
              </dl>

              <p className="mt-2 text-sm leading-relaxed text-white/70">
                <span className="text-white/50">Description: </span>
                {application.description}
              </p>

              {/* Actions + reason */}
              <div className="mt-6 space-y-3">
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="flex-1 rounded-lg border border-emerald-500 py-2 text-sm text-emerald-400 transition-colors hover:bg-emerald-500/10"
                  >
                    ✓ APPROVE
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-lg border border-red-500/60 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                  >
                    ✕ REJECT
                  </button>
                </div>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Write your reasons"
                  rows={3}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-white/40 resize-none"
                />
              </div>
            </div>

            {/* Right — image */}
            <div className="h-80 w-72 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-white/5">
              {application.image ? (
                <img
                  src={application.image}
                  alt={application.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-white/20">
                  <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1 text-sm">
      <dt className="text-white/50">{label}:</dt>
      <dd>{value}</dd>
    </div>
  );
}

function StatusBadge({ status }: { status: ExhibitionApplication["status"] }) {
  const styles = {
    Approved: "border-emerald-500/50 text-emerald-400",
    Rejected: "border-red-500/50 text-red-400",
    Pending: "border-amber-500/50 text-amber-400",
  };
  return (
    <span className={`rounded-full border px-3 py-0.5 text-xs ${styles[status]}`}>
      {status}
    </span>
  );
}
