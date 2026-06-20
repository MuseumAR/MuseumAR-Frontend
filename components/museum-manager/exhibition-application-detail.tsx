"use client";

import { PageDescription } from "@/components/dashboard/page-header";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import { EXHIBITION_APPLICATION_LABELS } from "@/lib/field-labels";
import type { ExhibitionApplication } from "@/types";
import Link from "next/link";
import { useState } from "react";

export function ExhibitionApplicationDetail({ application }: { application: ExhibitionApplication }) {
  const [reason, setReason] = useState("");

  return (
    <div className="px-8 pb-10">
      <PageDescription>
        Review exhibition application
      </PageDescription>
      <Link href="/museum-manager/exhibition-application" className="mb-6 inline-flex items-center gap-2 text-sm" style={{ color: T.muted }}>
        <span>?</span> Back to list
      </Link>

      <div className="rounded-3xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        <div className="flex gap-8">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <StatusBadge status={application.status} />
            </div>

            <dl className="space-y-2 text-sm" style={{ color: T.muted }}>
              <Row label={EXHIBITION_APPLICATION_LABELS.title!} value={application.title} />
              <Row label={EXHIBITION_APPLICATION_LABELS.exhibitionType!} value={application.exhibitionType} />
              <Row label={EXHIBITION_APPLICATION_LABELS.dateStart!} value={`${application.dateStart} - ${EXHIBITION_APPLICATION_LABELS.dateEnd}: ${application.dateEnd}`} />
              <Row label={EXHIBITION_APPLICATION_LABELS.openingHours!} value={`${application.openingHours} - ${EXHIBITION_APPLICATION_LABELS.closingHours}: ${application.closingHours}`} />
              <Row label={EXHIBITION_APPLICATION_LABELS.contactEmail!} value={application.contactEmail} />
            </dl>

            <p className="mt-2 text-sm leading-relaxed" style={{ color: T.muted }}>
              <span style={{ color: T.mutedLight }}>{EXHIBITION_APPLICATION_LABELS.description}: </span>
              {application.description}
            </p>

            <div className="mt-6 space-y-3">
              <div className="flex gap-3">
                <button type="button" className="flex-1 rounded-xl border py-2 text-sm" style={{ borderColor: "rgba(79,125,74,0.35)", color: T.success }}>
                  Approve
                </button>
                <button type="button" className="flex-1 rounded-xl border py-2 text-sm" style={{ borderColor: "rgba(180,83,9,0.35)", color: T.danger }}>
                  Reject
                </button>
              </div>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Write your reasons"
                rows={3}
                className="w-full resize-none rounded-xl px-4 py-3 text-sm outline-none"
                style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text }}
              />
            </div>
          </div>

          <div className="h-80 w-72 shrink-0 overflow-hidden rounded-2xl" style={{ border: `1px solid ${T.border}`, background: "rgba(200,155,69,0.08)" }}>
            {application.image ? (
              <img src={application.image} alt={application.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center" style={{ color: T.mutedLight }}>No image</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1 text-sm">
      <dt style={{ color: T.mutedLight }}>{label}:</dt>
      <dd style={{ color: T.text }}>{value}</dd>
    </div>
  );
}

function StatusBadge({ status }: { status: ExhibitionApplication["status"] }) {
  const styles = {
    Approved: { border: "rgba(79,125,74,0.30)", bg: "rgba(79,125,74,0.10)", color: T.success },
    Rejected: { border: "rgba(180,83,9,0.30)", bg: "rgba(180,83,9,0.10)", color: T.danger },
    Pending: { border: "rgba(200,155,69,0.30)", bg: "rgba(200,155,69,0.12)", color: T.primaryDark },
  };
  const s = styles[status];
  return <span className="rounded-full border px-3 py-0.5 text-xs" style={{ borderColor: s.border, background: s.bg, color: s.color }}>{status}</span>;
}
