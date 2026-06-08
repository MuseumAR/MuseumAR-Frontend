import Link from "next/link";

export function Navbar() {
  return (
    <div className="absolute inset-x-3 top-3 z-50 flex items-center justify-between rounded-full border border-white/40 bg-white/25 px-6 py-3 backdrop-blur-md">
      <Link
        href="/"
        className="flex items-center gap-2 text-sm font-medium text-white/80 transition-colors hover:text-white"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9M5 10v9a1 1 0 001 1h4v-4h4v4h4a1 1 0 001-1v-9" />
        </svg>
        Home
      </Link>
      <Link
        href="/login"
        className="rounded-full border border-white/40 bg-white/20 px-5 py-1 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/30"
      >
        Login
      </Link>
    </div>
  );
}
