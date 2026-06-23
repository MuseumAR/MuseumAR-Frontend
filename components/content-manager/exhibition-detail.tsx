import Link from "next/link";
import { PageDescription } from "@/components/dashboard/page-header";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import type { ExhibitionDto } from "@/types/api";

function StatusBadge({ status }: { status: string }) {
  const active = status === "Active";
  const upcoming = status === "Upcoming";
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{
        background: active
          ? "rgba(79,125,74,0.12)"
          : upcoming
            ? "rgba(200,155,69,0.15)"
            : "rgba(109,90,69,0.12)",
        color: active ? T.success : upcoming ? T.primaryDark : T.muted,
      }}
    >
      {status}
    </span>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return value.slice(0, 10);
}

export function ExhibitionDetail({ exhibition }: { exhibition: ExhibitionDto }) {
  return (
    <div className="px-8 pb-10">
      <PageDescription>Exhibition schedule and status</PageDescription>
      <Link
        href="/content-manager/exhibition"
        className="mb-6 inline-flex items-center gap-2 text-sm"
        style={{ color: T.muted }}
      >
        ← Back to list
      </Link>

      <div
        className="rounded-3xl p-6"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        <div className="flex flex-col gap-8 md:flex-row">
          <div
            className="h-56 w-full shrink-0 overflow-hidden rounded-2xl md:h-64 md:w-72"
            style={{ border: `1px solid ${T.border}`, background: "rgba(200,155,69,0.08)" }}
          >
            {exhibition.thumbnailUrl ? (
              <img
                src={exhibition.thumbnailUrl}
                alt={`Exhibition #${exhibition.id}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-sm"
                style={{ color: T.mutedLight }}
              >
                No thumbnail
              </div>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2
                className="text-xl font-semibold"
                style={{ fontFamily: cinzel, color: T.primaryDark }}
              >
                Exhibition #{exhibition.id}
              </h2>
              <StatusBadge status={exhibition.status} />
            </div>

            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <InfoRow label="Museum ID" value={String(exhibition.museumId)} />
              <InfoRow label="Status" value={exhibition.status} />
              <InfoRow label="Start date" value={formatDate(exhibition.startDate)} />
              <InfoRow label="End date" value={formatDate(exhibition.endDate)} />
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt style={{ color: T.mutedLight }}>{label}:</dt>
      <dd style={{ color: T.text }}>{value}</dd>
    </div>
  );
}
