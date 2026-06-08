import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";

export default function LoginPage() {
  return (
    <main className="relative flex h-screen bg-black p-3 gap-3">
      {/* Navbar — absolute, float over cards */}
      <Navbar />

      {/* Cards row */}
      <div className="flex flex-1 gap-3">
        {/* Left column — 2 stacked cards */}
        <div className="flex h-full w-[46%] shrink-0 flex-col gap-3">

          {/* Top card — 60% — title lower-left */}
          <div className="relative flex-[6] overflow-hidden rounded-3xl">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80')",
              }}
            />
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative z-10 flex h-full flex-col p-6">
              <div className="mt-auto">
                <h1 className="text-4xl font-bold leading-tight text-white drop-shadow-lg">
                  Where
                  <br />
                  History
                  <br />
                  Meets
                  <br />
                  Imagination
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
                  "url('https://images.unsplash.com/photo-1530639834082-05bafb67fbbe?w=800&q=80')",
              }}
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative z-10 flex h-full items-end p-6">
              <div className="rounded-2xl bg-black/50 px-6 py-5 backdrop-blur-sm">
                <ul className="space-y-2.5">
                  {[
                    "Scan the Past, Discover the Story",
                    "Every Artifact Has a Story",
                    "Unlock History with AR",
                    "Scan. Discover. Experience.",
                    "See Beyond the Artifact",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-white">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Right card — full height */}
        <div className="relative flex-1 overflow-hidden rounded-3xl">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&q=80')",
            }}
          />
          <div className="absolute inset-0 bg-black/30" />

            {/* Form — centered in card */}
          <div className="relative z-10 flex h-full items-center justify-center px-10">
            <div className="w-full max-w-sm rounded-2xl border border-white/25 bg-white/20 p-8 backdrop-blur-xl">
              <h2 className="mb-6 text-center text-2xl font-bold tracking-widest text-white">
                LOGIN
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
              </div>

              <div className="mt-2 flex justify-end">
                <Link href="#" className="text-xs text-white/80 hover:text-white">
                  Forgot your password?
                </Link>
              </div>

              <Link
                href="/museum-manager/overview"
                className="mt-4 block w-full rounded-xl bg-black/90 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-black"
              >
                Login
              </Link>

              <p className="mt-4 text-center text-xs text-white/80">
                Don&apos;t have account?{" "}
                <Link href="/register" className="font-medium text-white hover:underline">
                  Register
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
