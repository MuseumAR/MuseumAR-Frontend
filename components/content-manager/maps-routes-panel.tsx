"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Clock, ExternalLink, Info, Map, MapPin, Plus, Route, Upload } from "lucide-react";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import { getDisplayError } from "@/lib/validation";
import {
  createMapWithImage,
  createRouteEntry,
} from "@/services/content-manager/maps-routes.service";
import type { MuseumMapDto, TourRouteDto } from "@/types/api";

type Tab = "maps" | "routes";

const FLOOR_OPTIONS = [
  { value: 1, label: "Floor 1" },
  { value: 2, label: "Floor 2" },
  { value: 3, label: "Floor 3" },
  { value: 4, label: "Floor 4" },
  { value: 5, label: "Floor 5" },
  { value: -1, label: "Basement B1" },
] as const;

function getMapDisplayName(item: MuseumMapDto): string {
  if (item.mapName?.trim()) return item.mapName.trim();
  if (item.mapType === "overview" || item.floorNumber === 0) return "Overview";
  if (item.floorNumber === -1) return "Basement B1";
  if (item.floorNumber > 0) return `Floor ${item.floorNumber}`;
  return "Floor plan";
}

function MapTypeBadge({ mapType }: { mapType: string }) {
  const overview = mapType === "overview";
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
      style={{
        background: overview ? "rgba(79,125,74,0.12)" : "rgba(200,155,69,0.15)",
        color: overview ? T.success : T.primaryDark,
      }}
    >
      {mapType}
    </span>
  );
}

function MapPreview({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className="flex h-36 items-center justify-center rounded-2xl"
        style={{ background: "rgba(200,155,69,0.08)", border: `1px solid ${T.border}` }}
      >
        <Map className="h-8 w-8" style={{ color: T.mutedLight }} />
      </div>
    );
  }

  return (
    <div
      className="h-36 overflow-hidden rounded-2xl"
      style={{ border: `1px solid ${T.border}` }}
    >
      <img
        src={url}
        alt=""
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export function MapsRoutesPanel({
  maps,
  routes,
  museumId,
}: {
  maps: MuseumMapDto[];
  routes: TourRouteDto[];
  museumId: number;
}) {
  const router = useRouter();
  const mapFileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>("maps");
  const [showMapForm, setShowMapForm] = useState(false);
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [mapFile, setMapFile] = useState<File | null>(null);
  const [mapPreview, setMapPreview] = useState<string | null>(null);
  const [mapType, setMapType] = useState("floor");
  const [floorNumber, setFloorNumber] = useState(1);
  const [mapName, setMapName] = useState("");
  const [routeName, setRouteName] = useState("");
  const [routeMinutes, setRouteMinutes] = useState("");
  const [mapError, setMapError] = useState<string | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<"map" | "route" | null>(null);

  async function handleCreateMap(e: React.FormEvent) {
    e.preventDefault();
    if (!mapFile) {
      setMapError("Please choose a map image from your device.");
      return;
    }
    setSubmitting("map");
    setMapError(null);
    try {
      await createMapWithImage(
        museumId,
        mapFile,
        mapType,
        mapType === "overview" ? 0 : floorNumber,
        mapName.trim() || undefined,
      );
      setMapFile(null);
      setMapPreview(null);
      setMapName("");
      setFloorNumber(1);
      if (mapFileRef.current) mapFileRef.current.value = "";
      setShowMapForm(false);
      router.refresh();
    } catch (err) {
      setMapError(getDisplayError(err, "Unable to upload map."));
    } finally {
      setSubmitting(null);
    }
  }

  function handleMapFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMapError("Please select an image file (PNG, JPG, …).");
      return;
    }
    setMapError(null);
    setMapFile(file);
    setMapPreview(URL.createObjectURL(file));
  }

  async function handleCreateRoute(e: React.FormEvent) {
    e.preventDefault();
    if (!routeName.trim()) {
      setRouteError("Route name is required.");
      return;
    }
    setSubmitting("route");
    setRouteError(null);
    try {
      await createRouteEntry({
        museumId,
        name: routeName.trim(),
        estimatedDurationMinutes: routeMinutes ? Number(routeMinutes) : undefined,
      });
      setRouteName("");
      setRouteMinutes("");
      setShowRouteForm(false);
      router.refresh();
    } catch (err) {
      setRouteError(getDisplayError(err, "Unable to create route."));
    } finally {
      setSubmitting(null);
    }
  }

  const tabBtn = (id: Tab, label: string, count: number, Icon: typeof Map) => {
    const active = tab === id;
    return (
      <button
        type="button"
        onClick={() => setTab(id)}
        className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-medium transition-opacity"
        style={{
          background: active
            ? `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`
            : T.surface,
          color: active ? T.surface : T.muted,
          border: active ? "none" : `1px solid ${T.border}`,
        }}
      >
        <Icon className="h-4 w-4" />
        {label}
        <span
          className="rounded-full px-2 py-0.5 text-xs"
          style={{
            background: active ? "rgba(255,255,255,0.2)" : "rgba(200,155,69,0.12)",
            color: active ? T.surface : T.primaryDark,
          }}
        >
          {count}
        </span>
      </button>
    );
  };

  return (
    <div className="space-y-6 px-8 pb-10">
      <div
        className="flex gap-3 rounded-2xl p-4"
        style={{ background: "rgba(200,155,69,0.08)", border: `1px solid ${T.border}` }}
      >
        <Info className="mt-0.5 h-5 w-5 shrink-0" style={{ color: T.primaryDark }} />
        <div className="space-y-1 text-sm" style={{ color: T.muted }}>
          <p style={{ color: T.text }}>
            <strong>Maps & Routes</strong> manages 2D floor plans and suggested visit routes for the mobile app.
          </p>
          <p>
            <strong>Museum maps</strong> — floor or area layout images.{" "}
            <strong>Tour routes</strong> — suggested paths (name + estimated duration).
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {tabBtn("maps", "Museum maps", maps.length, MapPin)}
        {tabBtn("routes", "Tour routes", routes.length, Route)}
      </div>

      {tab === "maps" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-2xl font-semibold" style={{ fontFamily: cinzel, color: T.text }}>
              {maps.length} map{maps.length === 1 ? "" : "s"}
            </p>
            <button
              type="button"
              onClick={() => setShowMapForm((v) => !v)}
              className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-medium"
              style={{
                background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
                color: T.surface,
              }}
            >
              <Plus className="h-4 w-4" />
              {showMapForm ? "Close" : "Add map"}
            </button>
          </div>

          {showMapForm && (
            <form
              onSubmit={handleCreateMap}
              className="rounded-3xl p-6"
              style={{ background: T.surface, border: `1px solid ${T.border}` }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-sm" style={{ color: T.muted }}>
                    Map image *
                  </label>
                  <button
                    type="button"
                    onClick={() => mapFileRef.current?.click()}
                    className="flex min-h-[10rem] w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed px-4 py-6 text-center"
                    style={{
                      borderColor: T.border,
                      background: "rgba(200,155,69,0.08)",
                      color: T.muted,
                    }}
                  >
                    {mapPreview ? (
                      <img
                        src={mapPreview}
                        alt=""
                        className="max-h-48 w-full object-contain"
                      />
                    ) : (
                      <>
                        <Upload className="h-8 w-8" style={{ color: T.primaryDark }} />
                        <span className="text-sm">Click to choose image from your device</span>
                        <span className="text-xs">PNG, JPG, WEBP</span>
                      </>
                    )}
                  </button>
                  <input
                    ref={mapFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleMapFileChange}
                  />
                  {mapFile && (
                    <p className="text-xs" style={{ color: T.muted }}>
                      Selected: {mapFile.name}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm" style={{ color: T.muted }}>
                    Map type
                  </label>
                  <select
                    value={mapType}
                    onChange={(e) => setMapType(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                    style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                  >
                    <option value="floor">Floor plan</option>
                    <option value="overview">Overview</option>
                  </select>
                </div>
                {mapType === "floor" && (
                  <div className="space-y-1.5">
                    <label className="block text-sm" style={{ color: T.muted }}>
                      Floor *
                    </label>
                    <select
                      value={floorNumber}
                      onChange={(e) => setFloorNumber(Number(e.target.value))}
                      className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                      style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                    >
                      {FLOOR_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-sm" style={{ color: T.muted }}>
                    Map name <span style={{ color: T.mutedLight }}>(optional)</span>
                  </label>
                  <input
                    value={mapName}
                    onChange={(e) => setMapName(e.target.value)}
                    placeholder={
                      mapType === "overview"
                        ? "Overview"
                        : FLOOR_OPTIONS.find((o) => o.value === floorNumber)?.label ?? "Floor 1"
                    }
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                    style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                  />
                </div>
              </div>
              {mapError && (
                <p className="mt-4 text-sm" style={{ color: "#8B2E2E" }}>
                  {mapError}
                </p>
              )}
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting === "map"}
                  className="rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-50"
                  style={{ background: T.primary, color: T.surface }}
                >
                  {submitting === "map" ? "Uploading…" : "Upload map"}
                </button>
              </div>
            </form>
          )}

          {maps.length === 0 ? (
            <div
              className="rounded-3xl px-8 py-16 text-center"
              style={{ background: T.surface, border: `1px solid ${T.border}` }}
            >
              <MapPin className="mx-auto h-10 w-10" style={{ color: T.mutedLight }} />
              <p className="mt-4 text-sm" style={{ color: T.muted }}>
                No museum maps yet. Add a floor plan or overview image.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {maps.map((item) => (
                <article
                  key={item.id}
                  className="rounded-3xl p-5"
                  style={{ background: T.surface, border: `1px solid ${T.border}` }}
                >
                  <MapPreview url={item.mapImageUrl} />
                  <div className="mt-4 flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium" style={{ color: T.text }}>
                        {getMapDisplayName(item)}
                      </p>
                      <p className="text-xs" style={{ color: T.mutedLight }}>
                        Map #{item.id}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <MapTypeBadge mapType={item.mapType} />
                        {item.mapType === "floor" && item.floorNumber > 0 && (
                          <span
                            className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                            style={{
                              background: "rgba(109,90,69,0.1)",
                              color: T.muted,
                            }}
                          >
                            Floor {item.floorNumber}
                          </span>
                        )}
                        {item.floorNumber === -1 && (
                          <span
                            className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                            style={{
                              background: "rgba(109,90,69,0.1)",
                              color: T.muted,
                            }}
                          >
                            Basement B1
                          </span>
                        )}
                      </div>
                    </div>
                    <a
                      href={item.mapImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium"
                      style={{ color: T.primaryDark }}
                    >
                      Open
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <p
                    className="mt-3 truncate text-xs"
                    style={{ color: T.muted }}
                    title={item.mapImageUrl}
                  >
                    {item.mapImageUrl}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "routes" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-2xl font-semibold" style={{ fontFamily: cinzel, color: T.text }}>
              {routes.length} route{routes.length === 1 ? "" : "s"}
            </p>
            <button
              type="button"
              onClick={() => setShowRouteForm((v) => !v)}
              className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-medium"
              style={{
                background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
                color: T.surface,
              }}
            >
              <Plus className="h-4 w-4" />
              {showRouteForm ? "Close" : "Add route"}
            </button>
          </div>

          {showRouteForm && (
            <form
              onSubmit={handleCreateRoute}
              className="rounded-3xl p-6"
              style={{ background: T.surface, border: `1px solid ${T.border}` }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-sm" style={{ color: T.muted }}>
                    Route name *
                  </label>
                  <input
                    value={routeName}
                    onChange={(e) => setRouteName(e.target.value)}
                    placeholder="Bronze Essence Express Tour"
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                    style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm" style={{ color: T.muted }}>
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={routeMinutes}
                    onChange={(e) => setRouteMinutes(e.target.value)}
                    placeholder="45"
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                    style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                  />
                </div>
              </div>
              {routeError && (
                <p className="mt-4 text-sm" style={{ color: "#8B2E2E" }}>
                  {routeError}
                </p>
              )}
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting === "route"}
                  className="rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-50"
                  style={{ background: T.primary, color: T.surface }}
                >
                  {submitting === "route" ? "Saving…" : "Save route"}
                </button>
              </div>
            </form>
          )}

          <div
            className="overflow-hidden rounded-3xl"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}
          >
            {routes.length === 0 ? (
              <div className="px-8 py-16 text-center">
                <Route className="mx-auto h-10 w-10" style={{ color: T.mutedLight }} />
                <p className="mt-4 text-sm" style={{ color: T.muted }}>
                  No tour routes yet. Create a suggested visit path for visitors.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr
                    style={{
                      borderBottom: `1px solid ${T.border}`,
                      background: "rgba(245,230,200,0.35)",
                    }}
                  >
                    {["ID", "Route name", "Duration"].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-4 font-medium"
                        style={{ color: T.mutedLight }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {routes.map((item) => (
                    <tr key={item.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td className="px-5 py-4 font-medium" style={{ color: T.text }}>
                        {item.id}
                      </td>
                      <td className="px-5 py-4" style={{ color: T.text }}>
                        {item.name}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="inline-flex items-center gap-1.5"
                          style={{ color: T.muted }}
                        >
                          <Clock className="h-3.5 w-3.5" />
                          {item.estimatedDurationMinutes != null
                            ? `${item.estimatedDurationMinutes} min`
                            : "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
