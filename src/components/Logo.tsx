import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  /** Play the entrance animation on mount (respects prefers-reduced-motion). */
  animated?: boolean;
};

// Mark: a figure mid-stretch that doubles as a "K" — coral head, one arm
// reaching up with a couple of motion lines, and a leg extending in a single
// flowing line (kine + flow). The container is a leaf-like squircle.
export function LogoMark({ className, animated = false }: LogoProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("logo-mark size-8 overflow-visible", className)}
      data-animated={animated || undefined}
      aria-hidden
    >
      <path
        className="logo-bg fill-primary"
        d="M14 0h12a6 6 0 0 1 6 6v12a14 14 0 0 1-14 14H6a6 6 0 0 1-6-6V14A14 14 0 0 1 14 0z"
      />
      <g
        fill="none"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-primary-foreground"
      >
        <path className="logo-stroke logo-body" pathLength={1} d="M10 26c.5-5 1.5-9 1-14" />
        <path className="logo-stroke logo-arm" pathLength={1} d="M11 17c4-1.5 7.5-5 10-10.5" />
        <path className="logo-stroke logo-leg" pathLength={1} d="M11 17c3 2.5 5 5 9.5 6 1.5.3 2.5 0 3-.5" />
      </g>
      <g fill="none" strokeWidth="1.6" strokeLinecap="round" className="stroke-coral">
        <path className="logo-stroke logo-wave" pathLength={1} d="M24.5 7.5c1.2 1 1.8 2.3 1.8 3.6" />
        <path className="logo-stroke logo-wave logo-wave-2" pathLength={1} d="M22.8 11.2c.7.6 1 1.3 1 2" />
      </g>
      <circle className="logo-head fill-coral" cx="11.5" cy="7.2" r="2.7" />
    </svg>
  );
}

// Wordmark: the dot of the "i" is the same coral head as the mark.
export function Wordmark({ className, animated = false }: LogoProps) {
  return (
    <span
      className={cn("logo-word font-display text-2xl leading-none tracking-tight", className)}
      data-animated={animated || undefined}
    >
      k
      <span className="relative">
        ı
        <span
          className="logo-idot absolute top-[0.28em] left-[48%] size-[0.155em] -translate-x-1/2 rounded-full bg-coral"
          aria-hidden
        />
      </span>
      ne<em className="text-coral">flow</em>
    </span>
  );
}

export default function Logo({ className, animated = true }: LogoProps) {
  return (
    <span className={cn("logo group flex items-center gap-2", className)}>
      <LogoMark animated={animated} />
      <Wordmark animated={animated} />
    </span>
  );
}
