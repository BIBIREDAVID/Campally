import { Logo } from "@/components/shared/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full opacity-25 blur-3xl"
        style={{ background: "var(--illo-coral)" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-16 h-80 w-80 rounded-full opacity-20 blur-3xl"
        style={{ background: "var(--illo-blue)" }}
        aria-hidden="true"
      />

      <div className="relative flex w-full max-w-sm flex-col items-center gap-6">
        <Logo size={72} alt="Lagos State University Students' Union" priority />
        <div className="w-full rounded-2xl border border-border bg-card p-8 shadow-lg">{children}</div>
      </div>
    </div>
  );
}
