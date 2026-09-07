import { CheckEmailPanel } from "@/components/auth/check-email-panel";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          We sent a confirmation link to{" "}
          <span className="font-medium text-foreground">{email}</span>. Click it to activate your
          account.
        </p>
      </div>
      <CheckEmailPanel email={email ?? ""} />
    </div>
  );
}
