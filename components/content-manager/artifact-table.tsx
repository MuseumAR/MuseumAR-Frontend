"use client";

import { useMemo, useState } from "react";
import type { ArtifactRow } from "@/lib/mock-data";
import { formatNumber } from "@/lib/format";

const PAGE_SIZE = 10;

export function ArtifactTable({ data }: { data: ArtifactRow[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((row) => row.name.toLowerCase().includes(q));
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <svg
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          placeholder="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full rounded-full border border-white/25 bg-transparent py-2.5 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/50"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/25">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/20 text-white/70">
              <th className="px-5 py-4 font-normal">Id</th>
              <th className="px-5 py-4 font-normal">Name</th>
              <th className="px-5 py-4 font-normal">View</th>
              <th className="px-5 py-4 font-normal">Audio Play</th>
              <th className="px-5 py-4 font-normal">QR Scan</th>
              <th className="px-5 py-4 font-normal">AR Usage</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-white/10 last:border-0">
                <td className="px-5 py-4 tabular-nums">{row.id}</td>
                <td className="px-5 py-4">{row.name}</td>
                <td className="px-5 py-4 tabular-nums">{formatNumber(row.view)}</td>
                <td className="px-5 py-4 tabular-nums">{formatNumber(row.audioPlay)}</td>
                <td className="px-5 py-4 tabular-nums">{formatNumber(row.qrScan)}</td>
                <td className="px-5 py-4 tabular-nums">{formatNumber(row.arUsage)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPage(p)}
            className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm transition-colors ${
              p === currentPage
                ? "border-white bg-white text-black"
                : "border-white/25 text-white/70 hover:border-white/50"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="ml-1 flex h-9 w-9 items-center justify-center rounded-lg border border-white/25 text-white/70 transition-colors hover:border-white/50 disabled:opacity-30"
          aria-label="Next page"
        >
          →
        </button>
      </div>
    </div>
  );
}
