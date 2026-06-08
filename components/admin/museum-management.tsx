import { PageHeader } from "@/components/dashboard/page-header";
import type { Museum } from "@/types";

export function MuseumManagementTable({ museums }: { museums: Museum[] }) {
  return (
    <>
      <PageHeader title="Museum Management" icon="museum_management" />
      <div className="px-8 py-8">
        <div className="overflow-hidden rounded-2xl border border-white/25">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/20 text-white/60">
                <th className="px-5 py-4 font-normal">ID</th>
                <th className="px-5 py-4 font-normal">Museum Name</th>
                <th className="px-5 py-4 font-normal">Location</th>
                <th className="px-5 py-4 font-normal">Manager</th>
                <th className="px-5 py-4 font-normal">Status</th>
                <th className="px-5 py-4 font-normal" />
              </tr>
            </thead>
            <tbody>
              {museums.map((museum) => (
                <tr key={museum.id} className="border-b border-white/10 last:border-0">
                  <td className="px-5 py-4 tabular-nums">{museum.id}</td>
                  <td className="px-5 py-4">{museum.name}</td>
                  <td className="px-5 py-4 text-white/70">{museum.location}</td>
                  <td className="px-5 py-4">{museum.manager}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${museum.status === "Active" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                      {museum.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button type="button" className="rounded-md bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700">Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
