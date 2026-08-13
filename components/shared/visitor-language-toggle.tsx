"use client";

import { useLanguage, type Language } from "@/context/language-context";

const OPTIONS: { id: Language; label: string }[] = [
  { id: "vi", label: "VI" },
  { id: "en", label: "EN" },
];

export function VisitorLanguageToggle() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div
      className="inline-flex items-center rounded-full p-0.5 text-xs font-semibold"
      style={{
        background: "#FFF8E7",
        border: "1px solid rgba(200,155,60,0.25)",
      }}
      role="group"
      aria-label={t("lang.switch")}
    >
      {OPTIONS.map((option) => {
        const active = option.id === language;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => setLanguage(option.id)}
            className="min-w-[2rem] rounded-full px-2.5 py-1 text-center transition-all"
            style={{
              background: active ? "#C89B3C" : "transparent",
              color: active ? "#FFF8E7" : "#7D5A3C",
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
