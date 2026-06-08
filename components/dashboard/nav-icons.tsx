import type { NavIcon } from "@/lib/roles";

const iconClass = "h-5 w-5 shrink-0";

export function NavIcon({ icon }: { icon: NavIcon }) {
  switch (icon) {
    case "overview":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
        </svg>
      );
    case "museum_profile":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 19V5M4 19h16" strokeLinecap="round" />
          <path d="M8 17V11M12 17V7M16 17v-4" strokeLinecap="round" />
        </svg>
      );
    case "artifact":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 3 4 9v12h16V9L12 3Z" strokeLinejoin="round" />
          <path d="M9 21v-6h6v6" strokeLinejoin="round" />
        </svg>
      );
    case "exhibition":
    case "exhibition_application":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
        </svg>
      );
    case "ticket_application":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 8h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 1 0-4V8Z" strokeLinejoin="round" />
          <path d="M12 8v8" strokeLinecap="round" strokeDasharray="2 3" />
        </svg>
      );
    case "staff":
    case "users":
    case "user_management":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M15 20c.4-2.2 2.2-4 5-4" strokeLinecap="round" />
        </svg>
      );
    case "analytics":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 19V5M4 19h16" strokeLinecap="round" />
          <path d="M8 15V11M12 15V7M16 15v-3" strokeLinecap="round" />
        </svg>
      );
    case "activity_log":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M7 8h10M7 12h10M7 16h6" strokeLinecap="round" />
        </svg>
      );
    case "museum_application":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0" />
        </svg>
      );
    case "museum_management":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 21h18M3 10h18M12 3 3 10h18L12 3Z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 10v11M18 10v11M10 10v11M14 10v11" strokeLinecap="round" />
        </svg>
      );
  }
}
