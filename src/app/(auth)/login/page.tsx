import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">Log in</h1>
        <p className="text-sm text-muted-foreground">Welcome back.</p>
      </div>
      <LoginForm />
    </div>
  );
}
