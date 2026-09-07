export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-gradient-to-br from-accent/40 to-background px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-lg">
        {children}
      </div>
    </div>
  );
}
