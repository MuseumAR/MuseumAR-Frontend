export function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/25 px-6 py-5">
      <p className="text-sm text-white/70">{label}</p>
      <p className="mt-2 text-3xl font-light tabular-nums">{value}</p>
    </div>
  );
}
