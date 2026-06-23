import { PageDescription } from "@/components/dashboard/page-header";
import { NoMuseumEmptyState } from "@/components/museum-manager/no-museum-empty-state";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import { MUSEUM_PROFILE_LABELS } from "@/lib/field-labels";
import type { MuseumProfile } from "@/types";
import Link from "next/link";

export function MuseumProfileView({ profile }: { profile: MuseumProfile | null }) {
  if (!profile) {
    return (
      <div className="px-8 pb-10">
        <PageDescription>Museum identity and contact information</PageDescription>
        <NoMuseumEmptyState />
      </div>
    );
  }

  return (
    <div className="px-8 pb-10">
      <PageDescription>Museum identity and contact information</PageDescription>
      <div className="mb-4 flex justify-end">
        <Link
          href="/museum-manager/museum-profile/create"
          className="rounded-xl px-4 py-2 text-sm font-medium"
          style={{
            background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
            color: T.surface,
          }}
        >
          Register another museum
        </Link>
      </div>

      <div
        className="rounded-3xl p-6"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        <div className="flex gap-8">
          <div
            className="h-48 w-48 shrink-0 overflow-hidden rounded-2xl"
            style={{ border: `1px solid ${T.border}`, background: "rgba(200,155,69,0.08)" }}
          >
            {profile.image ? (
              <img src={profile.image} alt={profile.name} className="h-full w-full object-cover" />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center"
                style={{ color: T.mutedLight }}
              >
                No image
              </div>
            )}
          </div>

          <div className="flex-1 space-y-5">
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              <Info label={MUSEUM_PROFILE_LABELS.name!} value={profile.name} />
              <Info label={MUSEUM_PROFILE_LABELS.address!} value={profile.address} />
              <Info
                label={MUSEUM_PROFILE_LABELS.email!}
                value={profile.email}
                link={profile.email !== "—" ? `mailto:${profile.email}` : undefined}
              />
              <Info
                label={MUSEUM_PROFILE_LABELS.phone!}
                value={profile.phone}
                link={profile.phone !== "—" ? `tel:${profile.phone}` : undefined}
              />
            </div>

            <div className="grid grid-cols-2 gap-x-8">
              <Box label={MUSEUM_PROFILE_LABELS.openingHours!} value={profile.openingHours} />
              <Box label={MUSEUM_PROFILE_LABELS.closingHours!} value={profile.closingHours} />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Link
            href="/museum-manager/museum-profile/edit"
            className="rounded-xl border px-5 py-1.5 text-sm"
            style={{ borderColor: "rgba(79,125,74,0.35)", color: T.success }}
          >
            Update
          </Link>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, link }: { label: string; value: string; link?: string }) {
  return (
    <div>
      <p className="text-xs font-medium" style={{ color: T.mutedLight }}>
        {label}
      </p>
      {link ? (
        <a href={link} className="mt-1 block text-sm" style={{ color: T.text }}>
          {value}
        </a>
      ) : (
        <p className="mt-1 text-sm" style={{ color: T.text }}>
          {value}
        </p>
      )}
    </div>
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium" style={{ color: T.mutedLight }}>
        {label}
      </p>
      <div
        className="rounded-xl px-4 py-2 text-center text-sm"
        style={{ border: `1px solid ${T.border}`, color: T.text, fontFamily: cinzel }}
      >
        {value}
      </div>
    </div>
  );
}
