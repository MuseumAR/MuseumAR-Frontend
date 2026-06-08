import { PageHeader } from "@/components/dashboard/page-header";
import type { MuseumProfile } from "@/types";
import Link from "next/link";

export function MuseumProfileView({ profile }: { profile: MuseumProfile }) {
  return (
    <>
      <PageHeader title="Museum Profile" icon="museum_profile" />
      <div className="px-8 py-8">
        {/* Top-right action */}
        <div className="mb-4 flex justify-end">
          <Link
            href="/museum-manager/museum-profile/create"
            className="text-sm text-white/50 transition-colors hover:text-white"
          >
            Create new museum
          </Link>
        </div>

        {/* Profile card */}
        <div className="rounded-2xl border border-white/25 p-6">
          <div className="flex gap-8">
            {/* Museum image */}
            <div className="h-48 w-48 shrink-0 overflow-hidden rounded-xl border border-white/20 bg-white/5">
              {profile.image ? (
                <img
                  src={profile.image}
                  alt={profile.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-white/20">
                  <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

            {/* Info grid */}
            <div className="flex-1 space-y-5">
              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                {/* Museum Name */}
                <div>
                  <p className="text-xs font-medium text-white/50">Museum Name</p>
                  <p className="mt-1 text-sm">{profile.name}</p>
                </div>
                {/* Address */}
                <div>
                  <p className="text-xs font-medium text-white/50">Address</p>
                  <p className="mt-1 text-sm leading-snug">{profile.address}</p>
                </div>
                {/* Contact Email */}
                <div>
                  <p className="text-xs font-medium text-white/50">Contact Email</p>
                  <a
                    href={`mailto:${profile.email}`}
                    className="mt-1 block text-sm text-blue-400 hover:underline"
                  >
                    {profile.email}
                  </a>
                </div>
                {/* Phone Number */}
                <div>
                  <p className="text-xs font-medium text-white/50">Phone Number</p>
                  <a
                    href={`tel:${profile.phone}`}
                    className="mt-1 block text-sm text-blue-400 hover:underline"
                  >
                    {profile.phone}
                  </a>
                </div>
              </div>

              {/* Hours row */}
              <div className="grid grid-cols-2 gap-x-8">
                <div>
                  <p className="mb-1.5 text-xs font-medium text-white/50">Opening Hours</p>
                  <div className="rounded-lg border border-white/20 px-4 py-2 text-center text-sm">
                    {profile.openingHours}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-medium text-white/50">Closing Hours</p>
                  <div className="rounded-lg border border-white/20 px-4 py-2 text-center text-sm">
                    {profile.closingHours}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              className="rounded-lg border border-red-500/60 px-5 py-1.5 text-sm text-red-400 transition-colors hover:bg-red-500/10"
            >
              Delete
            </button>
            <Link
              href="/museum-manager/museum-profile/edit"
              className="rounded-lg border border-emerald-500 px-5 py-1.5 text-sm text-emerald-400 transition-colors hover:bg-emerald-500/10"
            >
              Update
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
