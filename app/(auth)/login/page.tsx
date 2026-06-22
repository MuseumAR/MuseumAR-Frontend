"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getHomePathForRole, login } from "@/services/auth";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: "#F5E6C8",
  card: "#FFF8E7",
  primary: "#C89B3C",
  secondary: "#A67C2D",
  text: "#2B1D0E",
  muted: "#6D5A45",
  mutedLight: "#A08060",
  border: "rgba(200,155,60,0.28)",
  borderFocus: "rgba(200,155,60,0.65)",
  inputBg: "rgba(245,230,200,0.55)",
  inputBgFocus: "#FFF8E7",
};

const CINZEL = "var(--font-cinzel), 'Trajan Pro', Georgia, serif";
const PLAYFAIR = "var(--font-playfair), Georgia, serif";

// ── Decorative helpers ────────────────────────────────────────────────────────

function OrnamentalRule() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1" style={{ background: C.border }} />
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="4" y="0" width="6" height="6" transform="rotate(45 7 7)" fill={C.primary} opacity="0.65" />
      </svg>
      <div className="h-px flex-1" style={{ background: C.border }} />
    </div>
  );
}

// ── Museum exhibit labels on hero ─────────────────────────────────────────────
const EXHIBITS = [
  {
    id: 1,
    x: "5%",
    y: "38%",
    catalog: "CAT · №0247",
    name: "Egyptian Sarcophagus",
    period: "3000 BC · Cairo",
    status: "AR Model Available",
    delay: 0.9,
  },
  {
    id: 2,
    x: "60%",
    y: "20%",
    catalog: "CAT · №0391",
    name: "Ionic Capital",
    period: "480 BC · Athens",
    status: "3D Scan Complete",
    delay: 1.1,
  },
  {
    id: 3,
    x: "64%",
    y: "65%",
    catalog: "CAT · №0158",
    name: "Roman Mosaic",
    period: "200 AD · Rome",
    status: "Reconstructed",
    delay: 1.3,
  },
];

// ── Input component ───────────────────────────────────────────────────────────
function Field({
  type,
  name,
  value,
  onChange,
  placeholder,
  icon: Icon,
  suffix,
  disabled,
}: {
  type: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: React.ElementType;
  suffix?: React.ReactNode;
  disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <Icon
        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-200"
        style={{ color: focused ? C.primary : C.mutedLight }}
      />
      <input
        type={type}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full rounded-2xl py-3.5 pl-11 pr-12 text-sm outline-none transition-all duration-200 disabled:opacity-60"
        style={{
          background: focused ? C.inputBgFocus : C.inputBg,
          border: `1px solid ${focused ? C.borderFocus : C.border}`,
          color: C.text,
        }}
      />
      {suffix && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">{suffix}</div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await login({ email, password });
      router.push(getHomePathForRole(result.roleName));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: C.bg }}>

      {/* Back to Home */}
      <Link
        href="/"
        className="group absolute left-6 top-5 z-50 flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-all duration-200"
        style={{
          background: "rgba(255,248,231,0.80)",
          border: `1px solid ${C.border}`,
          color: C.muted,
          backdropFilter: "blur(10px)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.color = C.text;
          (e.currentTarget as HTMLElement).style.borderColor = C.primary;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.color = C.muted;
          (e.currentTarget as HTMLElement).style.borderColor = C.border;
        }}
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
        Back to Home
      </Link>

      {/* ══ LEFT HERO 60% ══════════════════════════════════════════════════ */}
      <div className="relative hidden w-[60%] overflow-hidden lg:block">

        {/* Monument image — sepia treated */}
        <div
          className="absolute inset-0 scale-105 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=1800&q=90')",
            filter: "sepia(0.60) brightness(0.58) contrast(1.08)",
          }}
        />

        {/* Warm gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: [
              "linear-gradient(180deg, rgba(43,29,14,0.62) 0%, rgba(43,29,14,0.28) 45%, rgba(43,29,14,0.85) 100%)",
              "linear-gradient(90deg, rgba(43,29,14,0.48) 0%, transparent 60%)",
            ].join(", "),
          }}
        />

        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 85% 85% at 50% 50%, transparent 40%, rgba(43,29,14,0.50) 100%)",
          }}
        />

        {/* Parchment grain */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "128px 128px",
          }}
        />

        {/* Decorative corner brackets */}
        {["left-6 top-6 border-l border-t","right-6 top-6 border-r border-t","bottom-6 left-6 border-b border-l","bottom-6 right-6 border-b border-r"].map((cls) => (
          <div key={cls} className={`absolute z-10 h-9 w-9 ${cls}`} style={{ borderColor: "rgba(200,155,60,0.55)" }} />
        ))}

        {/* Exhibit label cards */}
        {EXHIBITS.map((ex) => (
          <motion.div
            key={ex.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: ex.delay, duration: 0.5 }}
            className="absolute z-20"
            style={{ left: ex.x, top: ex.y, transform: "translateY(-50%)" }}
          >
            <div
              className="overflow-hidden rounded-xl"
              style={{
                minWidth: "164px",
                background: "rgba(255,248,231,0.93)",
                border: `1px solid rgba(200,155,60,0.42)`,
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 20px rgba(43,29,14,0.22)",
              }}
            >
              <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${C.primary}, ${C.secondary})` }} />
              <div className="px-3.5 py-2.5">
                <p className="text-[9px] font-medium uppercase tracking-[0.2em]" style={{ color: C.primary }}>
                  {ex.catalog}
                </p>
                <p className="mt-1 text-xs font-semibold leading-tight" style={{ fontFamily: PLAYFAIR, color: C.text }}>
                  {ex.name}
                </p>
                <p className="mt-0.5 text-[10px]" style={{ color: C.muted }}>{ex.period}</p>
                <div className="mt-2 flex items-center gap-1.5 rounded px-2 py-0.5" style={{ background: "rgba(200,155,60,0.12)" }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: C.primary }} />
                  <span className="text-[10px] font-medium" style={{ color: C.secondary }}>{ex.status}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Hero copy */}
        <div className="relative z-10 flex h-full flex-col justify-between p-14">

          {/* Top badge */}
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="inline-flex w-fit items-center gap-2.5 rounded-full px-4 py-2"
            style={{
              background: "rgba(255,248,231,0.12)",
              border: "1px solid rgba(200,155,60,0.45)",
              backdropFilter: "blur(8px)",
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: C.primary }} />
            <span className="text-[11px] font-medium tracking-[0.2em]" style={{ color: "rgba(245,230,200,0.85)" }}>
              AUGMENTED REALITY · MUSEUM PLATFORM
            </span>
          </motion.div>

          {/* Bottom headline */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.65 }}
            >
              {/* Ornamental top rule */}
              <div className="mb-5 flex items-center gap-3">
                <div className="h-px w-8" style={{ background: "rgba(200,155,60,0.55)" }} />
                <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: "rgba(200,155,60,0.70)" }}>
                  Est. 2026
                </span>
              </div>

              <h1
                className="text-5xl font-bold leading-[1.08] tracking-wide text-white xl:text-6xl"
                style={{ fontFamily: CINZEL }}
              >
                Step Into
                <br />
                <span style={{ color: C.primary }}>History</span>
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="my-5 flex items-center gap-3"
            >
              <div className="h-px w-10" style={{ background: "rgba(200,155,60,0.45)" }} />
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="3.5" y="0" width="5" height="5" transform="rotate(45 6 6)" fill="#C89B3C" opacity="0.70" />
              </svg>
              <div className="h-px flex-1" style={{ background: "rgba(200,155,60,0.25)" }} />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="max-w-[380px] text-sm leading-relaxed"
              style={{ color: "rgba(245,230,200,0.68)" }}
            >
              Explore historical artifacts and cultural heritage through immersive
              augmented reality experiences.
            </motion.p>

            {/* Feature pills */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.62 }}
              className="mt-7 flex flex-wrap gap-2"
            >
              {["500+ Artifacts", "50+ Museums", "Live AR Tours"].map((pill) => (
                <div
                  key={pill}
                  className="rounded-full px-3 py-1.5 text-[11px]"
                  style={{
                    background: "rgba(255,248,231,0.08)",
                    border: "1px solid rgba(200,155,60,0.28)",
                    color: "rgba(245,230,200,0.65)",
                    backdropFilter: "blur(6px)",
                  }}
                >
                  {pill}
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* ══ RIGHT AUTH PANEL 40% ═══════════════════════════════════════════ */}
      <div
        className="relative flex w-full flex-col items-center justify-center px-6 lg:w-[40%]"
        style={{ background: C.bg }}
      >
        {/* Ambient radial glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(200,155,60,0.07) 0%, transparent 65%)",
          }}
        />

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, delay: 0.2 }}
          className="relative z-10 w-full max-w-[420px]"
        >
          {/* Card */}
          <div
            className="rounded-[28px] px-10 py-10"
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              boxShadow: "0 20px 60px rgba(43,29,14,0.10), 0 0 0 1px rgba(200,155,60,0.06)",
            }}
          >
            {/* Logo */}
            <div className="mb-7 flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold"
                style={{
                  background: `linear-gradient(135deg, ${C.primary} 0%, ${C.secondary} 100%)`,
                  color: C.card,
                  fontFamily: CINZEL,
                  boxShadow: `0 4px 16px rgba(166,124,45,0.32)`,
                }}
              >
                M
              </div>
              <div>
                <p className="text-sm font-semibold tracking-[0.2em]" style={{ fontFamily: CINZEL, color: C.text }}>
                  MUSEUM<span style={{ color: C.primary }}>AR</span>
                </p>
                <p className="text-[9px] tracking-widest uppercase" style={{ color: C.mutedLight }}>
                  Cultural Heritage Platform
                </p>
              </div>
            </div>

            <OrnamentalRule />

            {/* Heading */}
            <div className="mt-6 mb-1">
              <h2
                className="text-2xl font-bold tracking-wide"
                style={{ fontFamily: CINZEL, color: C.text }}
              >
                Welcome Back
              </h2>
              <p className="mt-1.5 text-sm" style={{ color: C.muted }}>
                Sign in to continue your historical journey
              </p>
            </div>

            {/* Inputs */}
            <form onSubmit={handleSubmit} className="mt-7 space-y-3">
              <Field
                type="email"
                name="email"
                value={email}
                onChange={setEmail}
                placeholder="Email address"
                icon={Mail}
                disabled={isSubmitting}
              />
              <Field
                type={showPassword ? "text" : "password"}
                name="password"
                value={password}
                onChange={setPassword}
                placeholder="Password"
                icon={Lock}
                disabled={isSubmitting}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="transition-colors"
                    style={{ color: C.mutedLight }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = C.text; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = C.mutedLight; }}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />

              {error && (
                <p className="rounded-xl px-3 py-2 text-xs" style={{ background: "rgba(180,40,40,0.08)", color: "#8B2E2E" }}>
                  {error}
                </p>
              )}

              {/* Forgot */}
              <div className="flex justify-end">
                <Link href="#" className="text-xs transition-colors hover:opacity-70" style={{ color: C.primary }}>
                  Forgot Password?
                </Link>
              </div>

              {/* Sign In */}
              <motion.div whileHover={{ scale: isSubmitting ? 1 : 1.015 }} whileTap={{ scale: isSubmitting ? 1 : 0.975 }} className="mt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2.5 rounded-2xl py-3.5 text-sm font-semibold tracking-wide transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    background: `linear-gradient(135deg, ${C.primary} 0%, ${C.secondary} 100%)`,
                    color: C.card,
                    boxShadow: `0 6px 24px rgba(166,124,45,0.38)`,
                    fontFamily: CINZEL,
                    letterSpacing: "0.12em",
                  }}
                >
                  {isSubmitting ? "Signing In..." : "Sign In"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>
            </form>

            {/* Divider */}
            <div className="my-5">
              <OrnamentalRule />
            </div>

            {/* Register */}
            <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.975 }}>
              <Link
                href="/register"
                className="flex w-full items-center justify-center rounded-2xl py-3.5 text-sm font-medium transition-all"
                style={{
                  border: `1px solid ${C.border}`,
                  color: C.muted,
                  background: "transparent",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(200,155,60,0.08)";
                  (e.currentTarget as HTMLElement).style.color = C.text;
                  (e.currentTarget as HTMLElement).style.borderColor = C.primary;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = C.muted;
                  (e.currentTarget as HTMLElement).style.borderColor = C.border;
                }}
              >
                Create New Account
              </Link>
            </motion.div>

            {/* Footer */}
            <p className="mt-6 text-center text-[11px]" style={{ color: "rgba(109,90,69,0.45)" }}>
              By signing in you agree to our{" "}
              <Link href="#" className="underline-offset-2 hover:underline" style={{ color: C.mutedLight }}>
                Terms of Service
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
