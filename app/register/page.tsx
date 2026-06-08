import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";

export default function RegisterPage() {
  return (
    <main className="relative flex h-screen bg-black p-3 gap-3">
      <Navbar />

      {/* Cards row */}
      <div className="flex h-full w-full gap-3">

        {/* Left card — form centered */}
        <div className="relative flex-1 overflow-hidden rounded-3xl">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80')",
              backgroundColor: "#2a1a0a",
            }}
          />
          <div className="absolute inset-0 bg-black/40" />

          <div className="relative z-10 flex h-full items-center justify-center px-10">
            <div className="w-full max-w-sm rounded-2xl border border-white/25 bg-white/20 p-8 backdrop-blur-xl">
              <h2 className="mb-6 text-center text-2xl font-bold tracking-widest text-white">
                Register
              </h2>

              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full rounded-xl bg-white/90 px-5 py-3 text-sm text-gray-700 placeholder-gray-400 outline-none"
                />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full rounded-xl bg-white/90 px-5 py-3 text-sm text-gray-700 placeholder-gray-400 outline-none"
                />
                <input
                  type="password"
                  placeholder="Confirm password"
                  className="w-full rounded-xl bg-white/90 px-5 py-3 text-sm text-gray-700 placeholder-gray-400 outline-none"
                />
              </div>

              <Link
                href="/login"
                className="mt-5 block w-full rounded-xl bg-black/90 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-black"
              >
                Register
              </Link>

              <p className="mt-4 text-center text-xs text-white/80">
                Have an account?{" "}
                <Link href="/login" className="font-medium text-white hover:underline">
                  Login
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Right column — 2 stacked cards */}
        <div className="flex h-full w-[46%] shrink-0 flex-col gap-3">

          {/* Top card — 60% — title bottom-left */}
          <div className="relative flex-[6] overflow-hidden rounded-3xl">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80')",
                backgroundColor: "#1a1008",
              }}
            />
            <div className="absolute inset-0 bg-black/25" />
            <div className="relative z-10 flex h-full flex-col p-6">
              <div className="mt-auto">
                <h1 className="text-4xl font-bold leading-tight text-white drop-shadow-lg">
                  Reimagining
                  <br />
                  History
                  <br />
                  Through
                  <br />
                  AR
                </h1>
              </div>
            </div>
          </div>

          {/* Bottom card — 40% — bullet points bottom-left */}
          <div className="relative flex-[4] overflow-hidden rounded-3xl">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1530639834082-05bafb67fbbe?auto=format&fit=crop&w=800&q=80')",
                backgroundColor: "#0a0a1a",
              }}
            />
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative z-10 flex h-full items-center justify-center p-6">
              <div className="rounded-2xl bg-black/50 px-8 py-6 backdrop-blur-sm">
                <ul className="space-y-4">
                  {[
                    "History Beyond What You See",
                    "Connecting Print and Future",
                    "Experience History in a New Dimension",
                    "The Future of Museum Exploration",
                    "Where History Comes Alive",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-base text-white">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-white" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
