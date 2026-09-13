"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/dashboard/stat-card";
import { getExhibitStats } from "@/services/content-manager/exhibit.service";

const EMPTY = { total: 0, published: 0, draft: 0, withAr: 0, withQr: 0 };

export function OverviewStats() {
  const [stats, setStats] = useState(EMPTY);

  useEffect(() => {
    let cancelled = false;
    getExhibitStats()
      .then((next) => {
        if (!cancelled) setStats(next);
      })
      .catch(() => {
        if (!cancelled) setStats(EMPTY);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard label="Total artifacts" value={stats.total} icon="layers" watermark="scroll" />
      <StatCard label="Published" value={stats.published} icon="box" watermark="column" />
      <StatCard label="Drafts" value={stats.draft} icon="layers" watermark="vase" />
      <StatCard label="With AR" value={stats.withAr} icon="box" watermark="map" />
      <StatCard label="With QR" value={stats.withQr} icon="qrCode" watermark="scroll" />
    </div>
  );
}
