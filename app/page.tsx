import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Ho_Chi_Minh_City_Hall.jpg/1280px-Ho_Chi_Minh_City_Hall.jpg')",
        }}
      />
      <div className="absolute inset-0 bg-black/55" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-white/60">
          Museum AR Management
        </p>
        <h1 className="text-5xl font-bold tracking-tight text-white md:text-6xl lg:text-7xl">
          WELCOME TO
          <br />
          <span className="text-amber-400">MUSEUM AR</span>
        </h1>
        <p className="mt-6 max-w-xl text-base text-white/70 leading-relaxed">
          A smart platform for managing and experiencing museum collections
          through Augmented Reality. Unlock history, one artifact at a time.
        </p>

        <div className="mt-10 flex items-center gap-4">
          <Link
            href="/login"
            className="rounded-full border border-white/40 px-8 py-3 text-sm font-medium text-white backdrop-blur-sm transition-all hover:border-white hover:bg-white/10"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-amber-500 px-8 py-3 text-sm font-medium text-black transition-all hover:bg-amber-400"
          >
            Register
          </Link>
        </div>
      </div>
    </main>
  );
}
