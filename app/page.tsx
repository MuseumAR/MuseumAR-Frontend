"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { BookOpen, Compass, Landmark, ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";

// ── Tokens ───────────────────────────────────────────────────────────────────

const C = {
  bg: "#F5E6C8",
  surface: "#FFF8E7",
  primary: "#C89B3C",
  secondary: "#A67C2D",
  text: "#2B1D0E",
  accent: "#5C4033",
  muted: "#7D5A3C",
  mutedLight: "#A08060",
  border: "rgba(200,155,60,0.30)",
  borderLight: "rgba(200,155,60,0.18)",
};

// ── Data ─────────────────────────────────────────────────────────────────────

const EXHIBIT_LABELS = [
  {
    id: 1,
    x: "6%",
    y: "42%",
    catalog: "CAT · №0247",
    name: "Egyptian Sarcophagus",
    period: "3000 BC · Cairo",
    status: "AR Model Available",
    delay: 1.1,
  },
  {
    id: 2,
    x: "70%",
    y: "22%",
    catalog: "CAT · №0391",
    name: "Ionic Capital",
    period: "480 BC · Athens",
    status: "3D Scan Complete",
    delay: 1.3,
  },
  {
    id: 3,
    x: "74%",
    y: "64%",
    catalog: "CAT · №0158",
    name: "Roman Mosaic",
    period: "200 AD · Rome",
    status: "Reconstructed",
    delay: 1.5,
  },
];

const FEATURES = [
  {
    roman: "I",
    icon: Landmark,
    title: "Interactive AR Tours",
    description:
      "Walk through reconstructed ancient sites with real-time AR overlays that reveal historical context layer by layer.",
  },
  {
    roman: "II",
    icon: BookOpen,
    title: "3D Artifact Visualization",
    description:
      "Examine priceless artifacts from every angle with photorealistic 3D models sourced from museum archives worldwide.",
  },
  {
    roman: "III",
    icon: Compass,
    title: "Historical Reconstruction",
    description:
      "Experience lost civilizations and ancient landmarks digitally restored to their original grandeur through AR technology.",
  },
];

const STATS = [
  { value: "10,000+", label: "Annual Visitors" },
  { value: "500+", label: "Archived Artifacts" },
  { value: "50+", label: "Partner Museums" },
  { value: "95%", label: "Visitor Satisfaction" },
];

// ── Decorative helpers ────────────────────────────────────────────────────────

function OrnamentalRule({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="h-px flex-1" style={{ background: C.border }} />
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="6" y="0" width="4" height="4" transform="rotate(45 8 8)" fill={C.primary} opacity="0.7" />
        <rect x="0" y="0" width="2.5" height="2.5" transform="rotate(45 7.25 8)" fill={C.primary} opacity="0.35" />
        <rect x="11" y="0" width="2.5" height="2.5" transform="rotate(45 8.75 8)" fill={C.primary} opacity="0.35" />
      </svg>
      <div className="h-px flex-1" style={{ background: C.border }} />
    </div>
  );
}

function CornerOrnament({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const borders = {
    tl: "border-l border-t top-0 left-0",
    tr: "border-r border-t top-0 right-0",
    bl: "border-l border-b bottom-0 left-0",
    br: "border-r border-b bottom-0 right-0",
  }[position];
  return (
    <div
      className={`absolute h-10 w-10 ${borders}`}
      style={{ borderColor: "rgba(200,155,60,0.55)" }}
    />
  );
}

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] as const },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const featuresRef = useRef(null);
  const statsRef = useRef(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: "-60px" });
  const statsInView = useInView(statsRef, { once: true, margin: "-60px" });

  return (
    <div style={{ background: C.bg, color: C.text }}>
      <Navbar />

      {/* ══ HERO ═══════════════════════════════════════════════════════════ */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">

        {/* Background image — sepia treated */}
        <div
          className="absolute inset-0 scale-105 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=1920&q=90')",
            filter: "sepia(0.65) brightness(0.62) contrast(1.05)",
          }}
        />

        {/* Warm gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: [
              "linear-gradient(180deg, rgba(43,29,14,0.60) 0%, rgba(43,29,14,0.30) 45%, rgba(43,29,14,0.82) 100%)",
              "linear-gradient(90deg, rgba(43,29,14,0.45) 0%, transparent 55%)",
            ].join(", "),
          }}
        />

        {/* Subtle vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 90% 90% at 50% 50%, transparent 40%, rgba(43,29,14,0.55) 100%)",
          }}
        />

        {/* Parchment grain — subtle noise overlay */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundSize: "128px 128px",
          }}
        />

        {/* Decorative corner brackets */}
        <div className="absolute left-6 top-[76px] z-10 h-10 w-10 border-l border-t" style={{ borderColor: "rgba(200,155,60,0.50)" }} />
        <div className="absolute right-6 top-[76px] z-10 h-10 w-10 border-r border-t" style={{ borderColor: "rgba(200,155,60,0.50)" }} />
        <div className="absolute bottom-6 left-6 z-10 h-10 w-10 border-b border-l" style={{ borderColor: "rgba(200,155,60,0.50)" }} />
        <div className="absolute bottom-6 right-6 z-10 h-10 w-10 border-b border-r" style={{ borderColor: "rgba(200,155,60,0.50)" }} />

        {/* Floating exhibit label cards */}
        {EXHIBIT_LABELS.map((ex) => (
          <motion.div
            key={ex.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: ex.delay, duration: 0.55 }}
            className="absolute z-20 hidden xl:block"
            style={{ left: ex.x, top: ex.y, transform: "translateY(-50%)" }}
          >
            <div
              className="overflow-hidden rounded-lg"
              style={{
                background: "rgba(255,248,231,0.92)",
                border: `1px solid rgba(200,155,60,0.45)`,
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 20px rgba(43,29,14,0.22)",
                minWidth: "168px",
              }}
            >
              {/* Gold top bar */}
              <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg, #C89B3C, #A67C2D)" }} />
              <div className="px-3.5 py-2.5">
                <p
                  className="text-[9px] font-medium tracking-[0.2em] uppercase"
                  style={{ color: C.primary }}
                >
                  {ex.catalog}
                </p>
                <p
                  className="mt-1 text-xs font-semibold leading-tight"
                  style={{
                    color: C.text,
                    fontFamily: "var(--font-playfair), Georgia, serif",
                  }}
                >
                  {ex.name}
                </p>
                <p className="mt-0.5 text-[10px]" style={{ color: C.muted }}>
                  {ex.period}
                </p>
                <div
                  className="mt-2 flex items-center gap-1.5 rounded px-2 py-0.5"
                  style={{ background: "rgba(200,155,60,0.12)" }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: C.primary }}
                  />
                  <span className="text-[10px] font-medium" style={{ color: C.secondary }}>
                    {ex.status}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {/* ── Hero content ── */}
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">

          {/* Badge */}
          <motion.div {...fadeUp(0.2)} className="mb-7 inline-flex items-center gap-2.5 rounded-full px-5 py-2" style={{ background: "rgba(255,248,231,0.14)", border: "1px solid rgba(200,155,60,0.45)", backdropFilter: "blur(8px)" }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: C.primary }} />
            <span
              className="text-xs tracking-[0.22em]"
              style={{ color: "rgba(245,230,200,0.85)", fontWeight: 500 }}
            >
              AUGMENTED REALITY · MUSEUM PLATFORM
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            {...fadeUp(0.35)}
            className="text-6xl font-bold leading-[1.05] tracking-tight text-white md:text-7xl lg:text-[5.5rem]"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Experience History
            <br />
            <span style={{ color: C.primary }}>Beyond Reality</span>
          </motion.h1>

          {/* Ornamental divider */}
          <motion.div {...fadeUp(0.48)} className="mx-auto mt-6 flex max-w-xs items-center gap-3">
            <div className="h-px flex-1" style={{ background: "rgba(200,155,60,0.45)" }} />
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="4.5" y="0" width="5" height="5" transform="rotate(45 7 7)" fill="#C89B3C" opacity="0.75" />
            </svg>
            <div className="h-px flex-1" style={{ background: "rgba(200,155,60,0.45)" }} />
          </motion.div>

          {/* Description */}
          <motion.p
            {...fadeUp(0.52)}
            className="mx-auto mt-6 max-w-lg text-base leading-relaxed"
            style={{ color: "rgba(245,230,200,0.72)" }}
          >
            Explore historical artifacts and cultural heritage through immersive
            Augmented Reality experiences that connect the past to the present.
          </motion.p>

          {/* CTAs */}
          <motion.div {...fadeUp(0.65)} className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/login"
                className="flex items-center gap-2.5 rounded-full px-8 py-3.5 text-sm font-semibold transition-opacity hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg, #C89B3C 0%, #A67C2D 100%)",
                  color: "#FFF8E7",
                  boxShadow: "0 6px 28px rgba(166,124,45,0.50)",
                  fontFamily: "inherit",
                }}
              >
                Start Exploring
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="#collections"
                className="flex items-center gap-2.5 rounded-full px-8 py-3.5 text-sm font-medium transition-all"
                style={{
                  background: "rgba(255,248,231,0.10)",
                  border: "1px solid rgba(245,230,200,0.40)",
                  color: "rgba(245,230,200,0.85)",
                  backdropFilter: "blur(8px)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,248,231,0.16)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,248,231,0.10)";
                }}
              >
                <BookOpen className="h-4 w-4" />
                View Collection
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1.5"
        >
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div
              className="h-7 w-px"
              style={{
                background: "linear-gradient(180deg, rgba(200,155,60,0.7) 0%, transparent 100%)",
              }}
            />
          </motion.div>
          <span
            className="text-[9px] tracking-[0.25em] uppercase"
            style={{ color: "rgba(200,155,60,0.6)" }}
          >
            Scroll
          </span>
        </motion.div>
      </section>

      {/* ══ FEATURES ═══════════════════════════════════════════════════════ */}
      <section
        ref={featuresRef}
        id="collections"
        className="px-6 py-28"
        style={{ background: C.surface }}
      >
        {/* Top decorative rule */}
        <div className="mx-auto mb-16 max-w-6xl">
          <OrnamentalRule />
        </div>

        <div className="mx-auto max-w-6xl">

          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <p
              className="mb-3 text-xs font-medium tracking-[0.3em] uppercase"
              style={{ color: C.primary }}
            >
              Platform Capabilities
            </p>
            <h2
              className="text-4xl font-bold leading-snug md:text-5xl"
              style={{
                fontFamily: "var(--font-playfair), Georgia, serif",
                color: C.text,
              }}
            >
              Where History
              <br />
              <span style={{ color: C.accent }}>Comes Alive</span>
            </h2>
          </motion.div>

          {/* Feature cards */}
          <div className="grid gap-6 md:grid-cols-3">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 28 }}
                  animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.55, delay: 0.15 + i * 0.12, ease: [0.22, 1, 0.36, 1] as const }}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className="group relative overflow-hidden rounded-2xl p-8"
                  style={{
                    background: C.bg,
                    border: `1px solid ${C.border}`,
                  }}
                >
                  {/* Gold top accent bar */}
                  <div
                    className="absolute inset-x-0 top-0 h-[3px]"
                    style={{
                      background: "linear-gradient(90deg, #C89B3C 0%, #A67C2D 100%)",
                      opacity: 0.7,
                    }}
                  />
                  {/* Corner ornaments */}
                  <CornerOrnament position="tl" />
                  <CornerOrnament position="tr" />

                  {/* Roman numeral */}
                  <p
                    className="mb-5 text-3xl font-light"
                    style={{
                      fontFamily: "var(--font-playfair), Georgia, serif",
                      color: C.borderLight,
                      letterSpacing: "0.05em",
                    }}
                  >
                    {feat.roman}
                  </p>

                  {/* Icon */}
                  <div
                    className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{
                      background: "rgba(200,155,60,0.12)",
                      border: `1px solid rgba(200,155,60,0.28)`,
                    }}
                  >
                    <Icon className="h-5 w-5" style={{ color: C.primary }} />
                  </div>

                  <h3
                    className="mb-3 text-lg font-semibold"
                    style={{
                      fontFamily: "var(--font-playfair), Georgia, serif",
                      color: C.text,
                    }}
                  >
                    {feat.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: C.muted }}>
                    {feat.description}
                  </p>
                  <div
                    className="mt-6 flex items-center gap-1.5 text-xs font-medium transition-all"
                    style={{ color: C.primary }}
                  >
                    Explore
                    <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bottom decorative rule */}
        <div className="mx-auto mt-16 max-w-6xl">
          <OrnamentalRule />
        </div>
      </section>

      {/* ══ STATS ══════════════════════════════════════════════════════════ */}
      <section
        ref={statsRef}
        id="museums"
        className="px-6 py-24"
        style={{ background: C.accent }}
      >
        <div className="mx-auto max-w-5xl">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={statsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="mb-14 text-center"
          >
            <p
              className="mb-2 text-xs tracking-[0.3em] uppercase"
              style={{ color: "rgba(200,155,60,0.70)" }}
            >
              By The Numbers
            </p>
            <h2
              className="text-3xl font-bold"
              style={{
                fontFamily: "var(--font-playfair), Georgia, serif",
                color: "#FFF8E7",
              }}
            >
              A Living Archive of History
            </h2>
          </motion.div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-y-10 md:grid-cols-4">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={statsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center"
              >
                <p
                  className="text-4xl font-bold md:text-5xl"
                  style={{
                    fontFamily: "var(--font-playfair), Georgia, serif",
                    color: C.primary,
                  }}
                >
                  {stat.value}
                </p>
                <p
                  className="mt-2 text-xs tracking-widest uppercase"
                  style={{ color: "rgba(255,248,231,0.50)" }}
                >
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ════════════════════════════════════════════════════════════ */}
      <section id="about" className="px-6 py-24" style={{ background: C.surface }}>
        <div className="mx-auto max-w-6xl">
          <OrnamentalRule className="mb-16" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={statsInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4, duration: 0.65 }}
          className="relative mx-auto max-w-2xl overflow-hidden rounded-3xl p-12 text-center"
          style={{
            background: C.bg,
            border: `1px solid ${C.border}`,
          }}
        >
          {/* Corner ornaments */}
          <CornerOrnament position="tl" />
          <CornerOrnament position="tr" />
          <CornerOrnament position="bl" />
          <CornerOrnament position="br" />

          <p
            className="mb-3 text-xs font-medium tracking-[0.3em] uppercase"
            style={{ color: C.primary }}
          >
            Begin Your Journey
          </p>
          <h3
            className="text-3xl font-bold leading-snug"
            style={{
              fontFamily: "var(--font-playfair), Georgia, serif",
              color: C.text,
            }}
          >
            Ready to explore
            <br />
            the ancient world?
          </h3>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed" style={{ color: C.muted }}>
            Join thousands of visitors experiencing history and cultural heritage
            through immersive augmented reality.
          </p>

          <OrnamentalRule className="mx-auto mt-7 max-w-xs" />

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/register"
                className="flex items-center gap-2 rounded-full px-8 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg, #C89B3C 0%, #A67C2D 100%)",
                  color: "#FFF8E7",
                  boxShadow: "0 4px 20px rgba(166,124,45,0.35)",
                }}
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
            <Link
              href="/login"
              className="rounded-full px-8 py-3 text-sm transition-all"
              style={{
                border: `1px solid ${C.border}`,
                color: C.muted,
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
              Sign In
            </Link>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="mx-auto mt-16 max-w-6xl">
          <OrnamentalRule className="mb-6" />
          <p className="text-center text-xs tracking-widest uppercase" style={{ color: C.mutedLight }}>
            © 2026 MuseumAR · Augmented Reality Museum Platform
          </p>
        </div>
      </section>
    </div>
  );
}
