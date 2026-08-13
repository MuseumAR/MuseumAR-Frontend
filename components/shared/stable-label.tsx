"use client";

import { getUiLabel, useLanguage } from "@/context/language-context";

/** Keeps width equal to the longer VI/EN label so language switch does not shift layout. */
export function StableLabel({
  k,
  className = "",
}: {
  k: string;
  className?: string;
}) {
  const { t } = useLanguage();
  const vi = getUiLabel(k, "vi");
  const en = getUiLabel(k, "en");

  return (
    <span className={`inline-grid justify-items-center ${className}`.trim()}>
      <span className="invisible col-start-1 row-start-1 whitespace-nowrap" aria-hidden>
        {vi}
      </span>
      <span className="invisible col-start-1 row-start-1 whitespace-nowrap" aria-hidden>
        {en}
      </span>
      <span className="col-start-1 row-start-1 whitespace-nowrap">{t(k)}</span>
    </span>
  );
}
