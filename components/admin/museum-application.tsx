import { PageHeader } from "@/components/dashboard/page-header";
import type { MuseumApplication } from "@/types";

export function MuseumApplicationTable({ applications }: { applications: MuseumApplication[] }) {
  return (
    <>
      <PageHeader title="Museum Application" icon="museum_application" />
      <div className="px-8 py-8">
        <div className="overflow-hidden rounded-2xl border border-white/25">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/20 text-white/60">
                <th className="px-5 py-4 font-normal">ID</th>
                <th className="px-5 py-4 font-normal">Museum</th>
                <th className="px-5 py-4 font-normal">Submitted</th>
                <th className="px-5 py-4 font-normal">Status</th>
                <th className="px-5 py-4 font-normal" />
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} className="border-b border-white/10 last:border-0">
                  <td className="px-5 py-4">{app.id}</td>
                  <td className="px-5 py-4">{app.museum}</td>
                  <td className="px-5 py-4 text-white/60">{app.submitted}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                      app.status === "Approved" ? "bg-emerald-500/20 text-emerald-400"
                      : app.status === "Rejected" ? "bg-red-500/20 text-red-400"
                      : "bg-amber-500/20 text-amber-400"
                    }`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {app.status === "Pending" && (
                      <div className="flex gap-2">
                        <button type="button" className="rounded-md bg-emerald-600 px-3 py-1 text-xs text-white hover:bg-emerald-700">Approve</button>
                        <button type="button" className="rounded-md bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700">Reject</button>
                      </div>
                    )}
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
