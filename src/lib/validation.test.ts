import { describe, expect, it } from "vitest";
import { isSchoolEmail, isValidMatricNumber } from "@/lib/validation";

describe("isValidMatricNumber", () => {
  it("accepts alphanumeric matric numbers with slashes and dashes", () => {
    expect(isValidMatricNumber("190591001")).toBe(true);
    expect(isValidMatricNumber("CSC/2019/001")).toBe(true);
    expect(isValidMatricNumber("ENG-19-0012")).toBe(true);
  });

  it("rejects too-short, too-long, or invalid-character values", () => {
    expect(isValidMatricNumber("abc")).toBe(false);
    expect(isValidMatricNumber("A".repeat(21))).toBe(false);
    expect(isValidMatricNumber("bad number!")).toBe(false);
    expect(isValidMatricNumber("")).toBe(false);
  });
});

describe("isSchoolEmail", () => {
  it("allows any email when no domain is configured", () => {
    expect(isSchoolEmail("anyone@example.com", null)).toBe(true);
    expect(isSchoolEmail("anyone@example.com", undefined)).toBe(true);
  });

  it("requires a matching domain, case-insensitively", () => {
    expect(isSchoolEmail("student@lasu.edu.ng", "@lasu.edu.ng")).toBe(true);
    expect(isSchoolEmail("student@LASU.EDU.NG", "@lasu.edu.ng")).toBe(true);
    expect(isSchoolEmail("student@gmail.com", "@lasu.edu.ng")).toBe(false);
  });
});
