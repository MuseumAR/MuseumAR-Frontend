"use client";

import { useCallback, useEffect, useState } from "react";
import { Box, ExternalLink, Trash2 } from "lucide-react";
import { dashboardTheme as T } from "@/lib/dashboard-theme";
import { getDisplayError } from "@/lib/validation";
import { deleteArAsset, getArAssets } from "@/services/content-manager";
import type { ExhibitArassetDto } from "@/types/api";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function normalizeAsset(raw: unknown): ExhibitArassetDto {
  const o = asRecord(raw);
  return {
    id: Number(o.id ?? o.Id ?? 0),
    exhibitId: Number(o.exhibitId ?? o.ExhibitId ?? 0),
    assetUrl: (o.assetUrl ?? o.AssetUrl) as string | null | undefined,
    assetType: (o.assetType ?? o.AssetType) as string | null | undefined,
    description: (o.description ?? o.Description) as string | null | undefined,
    createdAt: String(o.createdAt ?? o.CreatedAt ?? ""),
  };
}

function fileNameFromUrl(url: string) {
  try {
    const path = new URL(url, "https://local").pathname;
    const name = path.split("/").filter(Boolean).pop();
    return name ? decodeURIComponent(name) : url;
  } catch {
    return url;
  }
}

export function ArAssetsSection({
  exhibitId,
  initialAssets = [],
}: {
  exhibitId: number;
  initialAssets?: ExhibitArassetDto[];
}) {
  const [assets, setAssets] = useState<ExhibitArassetDto[]>(initialAssets);
  const [loading, setLoading] = useState(initialAssets.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const reload = useCallback(async () => {
    if (!exhibitId || Number.isNaN(exhibitId)) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getArAssets(exhibitId);
      const list = Array.isArray(data) ? data.map(normalizeAsset) : [];
      setAssets(list);
    } catch (err) {
      setError(getDisplayError(err, "Không thể tải tài sản AR."));
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, [exhibitId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function handleDelete(id: number) {
    if (!confirm("Xóa tài sản AR này?")) return;
    setDeletingId(id);
    setError(null);
    try {
      await deleteArAsset(id);
      setAssets((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(getDisplayError(err, "Không thể xóa tài sản AR."));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium" style={{ color: T.text }}>
        Tài sản AR hiện có
      </p>

      {error && (
        <p
          className="rounded-xl px-3 py-2 text-xs"
          style={{ background: "rgba(180,40,40,0.08)", color: "#8B2E2E" }}
        >
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-xs" style={{ color: T.muted }}>
          Đang tải tài sản AR…
        </p>
      ) : assets.length === 0 ? (
        <p className="text-xs" style={{ color: T.mutedLight }}>
          Chưa tải lên tài sản AR nào.
        </p>
      ) : (
        <ul className="space-y-2">
          {assets.map((asset) => {
            const url = asset.assetUrl?.trim() || "";
            const label = url ? fileNameFromUrl(url) : `Tài sản #${asset.id}`;
            return (
              <li
                key={asset.id}
                className="flex items-start gap-2 rounded-xl px-3 py-2.5"
                style={{ background: T.bg, border: `1px solid ${T.border}` }}
              >
                <Box className="mt-0.5 h-4 w-4 shrink-0" style={{ color: T.primaryDark }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium" style={{ color: T.text }} title={label}>
                    {label}
                  </p>
                  <p className="mt-0.5 text-[11px]" style={{ color: T.mutedLight }}>
                    {asset.assetType || "mô hình"}
                    {asset.createdAt ? ` · ${asset.createdAt.slice(0, 10)}` : ""}
                  </p>
                  {asset.description?.trim() && (
                    <p className="mt-1 truncate text-[11px]" style={{ color: T.muted }}>
                      {asset.description}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg p-1.5"
                      style={{ color: T.primaryDark }}
                      title="Mở / tải xuống"
                      aria-label="Xem tài sản AR"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void handleDelete(asset.id)}
                    disabled={deletingId === asset.id}
                    className="rounded-lg p-1.5 disabled:opacity-40"
                    style={{ color: T.danger }}
                    title="Xóa"
                    aria-label="Xóa tài sản AR"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
