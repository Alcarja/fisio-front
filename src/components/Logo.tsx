import { cn } from "@/lib/utils";

// Mark: a spine-like curve with a coral "joint"
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-8", className)}
      aria-hidden
    >
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <path
        d="M11 7c6 3 6 6 0 9s-6 6 0 9"
        transform="translate(4 0)"
        fill="none"
        strokeWidth="2.6"
        strokeLinecap="round"
        className="stroke-primary-foreground"
      />
      <circle cx="15" cy="16" r="3.2" className="fill-coral" />
    </svg>
  );
}

export default function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <LogoMark />
      <span className="font-display text-2xl leading-none tracking-tight">
        fisio
      </span>
    </span>
  );
}
