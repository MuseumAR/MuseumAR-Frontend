"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import { getDisplayError } from "@/lib/validation";
import { createMapEntry, createRouteEntry } from "@/services/content-manager/maps-routes.service";
import type { MuseumMapDto, TourRouteDto } from "@/types/api";

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
  const [mapUrl, setMapUrl] = useState("");
  const [mapType, setMapType] = useState("floor");
  const [routeName, setRouteName] = useState("");
  const [routeMinutes, setRouteMinutes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<"map" | "route" | null>(null);

  async function handleCreateMap(e: React.FormEvent) {
    e.preventDefault();
    if (!mapUrl.trim()) {
      setError("Map image URL is required.");
      return;
    }
    setSubmitting("map");
    setError(null);
    try {
      await createMapEntry({ museumId, mapImageUrl: mapUrl.trim(), mapType });
      setMapUrl("");
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Unable to create map."));
    } finally {
      setSubmitting(null);
    }
  }

  async function handleCreateRoute(e: React.FormEvent) {
    e.preventDefault();
    if (!routeName.trim()) {
      setError("Route name is required.");
      return;
    }
    setSubmitting("route");
    setError(null);
    try {
      await createRouteEntry({
        museumId,
        name: routeName.trim(),
        estimatedDurationMinutes: routeMinutes ? Number(routeMinutes) : undefined,
      });
      setRouteName("");
      setRouteMinutes("");
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Unable to create route."));
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="space-y-8 px-8 pb-10">
      <div>
        <h2 className="text-2xl font-semibold" style={{ fontFamily: cinzel, color: T.text }}>
          Navigation Content
        </h2>
      </div>

      {error && (
        <p className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(180,40,40,0.08)", color: "#8B2E2E" }}>
          {error}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <h3 className="mb-4 font-semibold" style={{ fontFamily: cinzel, color: T.text }}>Museum maps</h3>
          <form onSubmit={handleCreateMap} className="mb-6 space-y-3">
            <input value={mapUrl} onChange={(e) => setMapUrl(e.target.value)} placeholder="Map image URL" className="w-full rounded-xl px-4 py-2.5 text-sm outline-none" style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }} />
            <select value={mapType} onChange={(e) => setMapType(e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm outline-none" style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}>
              <option value="floor">Floor</option>
              <option value="overview">Overview</option>
            </select>
            <button type="submit" disabled={submitting === "map"} className="rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50" style={{ background: T.primary, color: T.surface }}>
              Add map
            </button>
          </form>
          {maps.length === 0 ? (
            <p className="text-sm" style={{ color: T.muted }}>No maps yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {maps.map((m) => (
                <li key={m.id} className="rounded-xl px-3 py-2" style={{ background: "rgba(200,155,69,0.08)", color: T.text }}>
                  #{m.id} · {m.mapType} — <span className="truncate text-xs" style={{ color: T.muted }}>{m.mapImageUrl}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-3xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <h3 className="mb-4 font-semibold" style={{ fontFamily: cinzel, color: T.text }}>Tour routes</h3>
          <form onSubmit={handleCreateRoute} className="mb-6 space-y-3">
            <input value={routeName} onChange={(e) => setRouteName(e.target.value)} placeholder="Route name" className="w-full rounded-xl px-4 py-2.5 text-sm outline-none" style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }} />
            <input type="number" min="1" value={routeMinutes} onChange={(e) => setRouteMinutes(e.target.value)} placeholder="Duration (minutes)" className="w-full rounded-xl px-4 py-2.5 text-sm outline-none" style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }} />
            <button type="submit" disabled={submitting === "route"} className="rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50" style={{ background: T.primary, color: T.surface }}>
              Add route
            </button>
          </form>
          {routes.length === 0 ? (
            <p className="text-sm" style={{ color: T.muted }}>No routes yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {routes.map((r) => (
                <li key={r.id} className="flex justify-between rounded-xl px-3 py-2" style={{ background: "rgba(200,155,69,0.08)", color: T.text }}>
                  <span>{r.name}</span>
                  <span style={{ color: T.muted }}>{r.estimatedDurationMinutes ?? "—"} min</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
