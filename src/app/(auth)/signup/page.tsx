import { getAcademicStructure } from "@/lib/queries/academic";
import { SignUpForm } from "@/components/auth/signup-form";

export default async function SignUpPage() {
  const structure = await getAcademicStructure();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          Use your school email and matric number to verify you&apos;re a student.
        </p>
      </div>
      <SignUpForm structure={structure} />
    </div>
  );
}
