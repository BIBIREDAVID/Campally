const MATRIC_NUMBER_PATTERN = /^[A-Za-z0-9/-]{4,20}$/;

export function isValidMatricNumber(value: string): boolean {
  return MATRIC_NUMBER_PATTERN.test(value);
}

export function isSchoolEmail(email: string, domain: string | null | undefined): boolean {
  if (!domain) return true;
  return email.toLowerCase().endsWith(domain.toLowerCase());
}
