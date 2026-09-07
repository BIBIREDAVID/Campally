"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { signUpAction } from "@/lib/actions/auth";
import type { AcademicLevel, Department, Faculty, Programme } from "@/types/domain";

interface Props {
  structure: {
    faculties: Faculty[];
    departments: Department[];
    programmes: Programme[];
    levels: AcademicLevel[];
  };
}

export function SignUpForm({ structure }: Props) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [schoolEmail, setSchoolEmail] = useState("");
  const [matricNumber, setMatricNumber] = useState("");
  const [password, setPassword] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [programmeId, setProgrammeId] = useState("");
  const [academicLevelId, setAcademicLevelId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const departments = useMemo(
    () => structure.departments.filter((d) => d.faculty_id === facultyId),
    [structure.departments, facultyId]
  );
  const programmes = useMemo(
    () => structure.programmes.filter((p) => p.department_id === departmentId),
    [structure.programmes, departmentId]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await signUpAction({
      firstName,
      lastName,
      schoolEmail,
      matricNumber,
      password,
      facultyId,
      departmentId,
      programmeId,
      academicLevelId,
    });

    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push(`/verify?email=${encodeURIComponent(schoolEmail)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="firstName">First name</Label>
          <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lastName">Last name</Label>
          <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="schoolEmail">School email</Label>
        <Input
          id="schoolEmail"
          type="email"
          value={schoolEmail}
          onChange={(e) => setSchoolEmail(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="matricNumber">Matric number</Label>
        <Input
          id="matricNumber"
          value={matricNumber}
          onChange={(e) => setMatricNumber(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Faculty</Label>
        <Select
          items={structure.faculties.map((f) => ({ value: f.id, label: f.name }))}
          value={facultyId}
          onValueChange={(v) => {
            setFacultyId(v ?? "");
            setDepartmentId("");
            setProgrammeId("");
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select faculty" />
          </SelectTrigger>
          <SelectContent>
            {structure.faculties.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Department</Label>
        <Select
          items={departments.map((d) => ({ value: d.id, label: d.name }))}
          value={departmentId}
          onValueChange={(v) => {
            setDepartmentId(v ?? "");
            setProgrammeId("");
          }}
          disabled={!facultyId}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectContent>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {programmes.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <Label>Programme (optional)</Label>
          <Select
            items={programmes.map((p) => ({ value: p.id, label: p.name }))}
            value={programmeId}
            onValueChange={(v) => setProgrammeId(v ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select programme" />
            </SelectTrigger>
            <SelectContent>
              {programmes.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label>Academic level</Label>
        <Select
          items={structure.levels.map((l) => ({ value: l.id, label: l.name }))}
          value={academicLevelId}
          onValueChange={(v) => setAcademicLevelId(v ?? "")}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select level" />
          </SelectTrigger>
          <SelectContent>
            {structure.levels.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <Button type="submit" disabled={submitting} className="mt-2">
        {submitting ? "Creating account..." : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary">
          Log in
        </Link>
      </p>
    </form>
  );
}
