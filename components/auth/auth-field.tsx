"use client";

import { useState, type ElementType, type HTMLAttributes } from "react";
import { AUTH_C } from "@/lib/auth-theme";

export function AuthField({
  type,
  name,
  value,
  onChange,
  placeholder,
  icon: Icon,
  suffix,
  disabled,
  required = true,
  maxLength,
  inputMode,
  autoComplete,
}: {
  type: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: ElementType;
  suffix?: React.ReactNode;
  disabled?: boolean;
  required?: boolean;
  maxLength?: number;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="relative">
      <Icon
        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-200"
        style={{ color: focused ? AUTH_C.primary : AUTH_C.mutedLight }}
      />
      <input
        type={type}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        maxLength={maxLength}
        inputMode={inputMode}
        autoComplete={autoComplete}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full rounded-2xl py-3.5 pl-11 pr-12 text-sm outline-none transition-all duration-200 disabled:opacity-60"
        style={{
          background: focused ? AUTH_C.inputBgFocus : AUTH_C.inputBg,
          border: `1px solid ${focused ? AUTH_C.borderFocus : AUTH_C.border}`,
          color: AUTH_C.text,
        }}
      />
      {suffix && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">{suffix}</div>
      )}
    </div>
  );
}
