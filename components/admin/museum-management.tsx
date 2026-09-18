import { dashboardTheme as T, sans, dashboardTitleClass } from "@/lib/dashboard-theme";
import { labelStatus } from "@/lib/status-labels";
import type { MuseumDto } from "@/types/api";

function visibleStatus(status: string) {
  if (status === "Active") return "Hoạt động";
  if (status === "Inactive") return "Không hoạt động";
  return labelStatus(status);
}

function StatusBadge({ status }: { status: string }) {
  const active = status === "Active";
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{
        background: active ? "rgba(79,125,74,0.12)" : "rgba(180,83,9,0.12)",
        color: active ? T.success : T.danger,
      }}
    >
      {visibleStatus(status)}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium" style={{ color: T.mutedLight }}>
        {label}
      </p>
      <p className="mt-1 text-sm" style={{ color: T.text, fontFamily: sans }}>
        {value}
      </p>
    </div>
  );
}

export function MuseumManagementPanel({ museum }: { museum: MuseumDto | null }) {
  if (!museum) {
    return (
      <div className="px-8 pb-10">
        <div
          className="rounded-3xl px-8 py-16 text-center"
          style={{ background: T.surface, border: `1px solid ${T.border}` }}
        >
          <p className="text-sm" style={{ color: T.muted }}>
            Chưa có hồ sơ bảo tàng.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 pb-10">
      <div
        className="rounded-3xl p-6"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        <div className="flex flex-col gap-6 lg:flex-row">
          <div
            className="h-40 w-40 shrink-0 overflow-hidden rounded-2xl"
            style={{ border: `1px solid ${T.border}`, background: "rgba(200,155,69,0.08)" }}
          >
            {museum.thumbnailUrl ? (
              <img
                src={museum.thumbnailUrl}
                alt={museum.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-sm"
                style={{ color: T.mutedLight }}
              >
                Chưa có ảnh
              </div>
            )}
          </div>

          <div className="flex-1 space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <h2
                className={dashboardTitleClass}
                style={{ fontFamily: sans, color: T.text }}
              >
                {museum.name}
              </h2>
              <StatusBadge status={museum.status} />
            </div>
            {museum.nameEn ? (
              <p className="text-sm" style={{ color: T.muted, fontFamily: sans }}>
                {museum.nameEn}
              </p>
            ) : null}

            {(() => {
              const addressParts = museum.address
                ? museum.address.split(",").map((p) => p.trim()).filter(Boolean)
                : [];
              const extractedCity =
                addressParts.length >= 1 ? addressParts[addressParts.length - 1] : null;
              const extractedProvince =
                addressParts.length >= 2 ? addressParts[addressParts.length - 2] : null;

              const displayCity =
                museum.city && museum.city !== "—" && museum.city !== "-"
                  ? museum.city
                  : extractedCity || "Thành phố Hồ Chí Minh";
              const displayProvince =
                museum.province && museum.province !== "—" && museum.province !== "-"
                  ? museum.province
                  : extractedProvince || "Quận 1";
              const displayCountry =
                museum.country && museum.country !== "—" && museum.country !== "-"
                  ? museum.country
                  : "Việt Nam";

              return (
                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoRow label="Mã" value={String(museum.id)} />
                  <InfoRow label="Thành phố" value={displayCity} />
                  <InfoRow label="Địa chỉ (VI)" value={museum.address ?? "—"} />
                  <InfoRow label="Địa chỉ (EN)" value={museum.addressEn ?? "—"} />
                  <InfoRow label="Quận/Huyện" value={displayProvince} />
                  <InfoRow label="Quốc gia" value={displayCountry} />
                  <InfoRow label="Điện thoại" value={museum.contactPhone ?? "—"} />
                  <InfoRow label="Email" value={museum.contactEmail ?? "—"} />
                  <InfoRow label="Website" value={museum.website ?? "—"} />
                  <InfoRow label="Giờ mở cửa (VI)" value={museum.openingHours ?? "—"} />
                  <InfoRow label="Giờ mở cửa (EN)" value={museum.openingHoursEn ?? "—"} />
                </div>
              );
            })()}

            {museum.description && (
              <div>
                <p className="text-xs font-medium" style={{ color: T.mutedLight }}>
                  Mô tả (VI)
                </p>
                <p
                  className="mt-1 text-sm leading-relaxed"
                  style={{ color: T.muted, fontFamily: sans }}
                >
                  {museum.description}
                </p>
              </div>
            )}
            {museum.descriptionEn && (
              <div>
                <p className="text-xs font-medium" style={{ color: T.mutedLight }}>
                  Mô tả (EN)
                </p>
                <p
                  className="mt-1 text-sm leading-relaxed"
                  style={{ color: T.muted, fontFamily: sans }}
                >
                  {museum.descriptionEn}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
