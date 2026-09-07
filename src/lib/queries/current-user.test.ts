import { describe, expect, it } from "vitest";
import { hasPermission, isAdminUser, isStaff, type CurrentUser } from "@/lib/queries/current-user";
import type { UserProfile } from "@/types/domain";

function makeUser(overrides: Partial<CurrentUser> = {}): CurrentUser {
  return {
    profile: { user_type: "student" } as UserProfile,
    permissions: [],
    ...overrides,
  };
}

describe("hasPermission", () => {
  it("returns false for a null user", () => {
    expect(hasPermission(null, "dashboard.view")).toBe(false);
  });

  it("returns true only when the key is present", () => {
    const user = makeUser({ permissions: ["cases.manage"] });
    expect(hasPermission(user, "cases.manage")).toBe(true);
    expect(hasPermission(user, "dashboard.view")).toBe(false);
  });
});

describe("isStaff", () => {
  it("checks the user_type column", () => {
    expect(isStaff(makeUser({ profile: { user_type: "staff" } as UserProfile }))).toBe(true);
    expect(isStaff(makeUser({ profile: { user_type: "student" } as UserProfile }))).toBe(false);
    expect(isStaff(null)).toBe(false);
  });
});

describe("isAdminUser", () => {
  it("is true for staff regardless of permissions", () => {
    const user = makeUser({ profile: { user_type: "staff" } as UserProfile, permissions: [] });
    expect(isAdminUser(user)).toBe(true);
  });

  it("is true for a student with dashboard.view (e.g. a Union Officer role)", () => {
    const user = makeUser({
      profile: { user_type: "student" } as UserProfile,
      permissions: ["dashboard.view"],
    });
    expect(isAdminUser(user)).toBe(true);
  });

  it("is false for a student with only a narrow permission", () => {
    const user = makeUser({
      profile: { user_type: "student" } as UserProfile,
      permissions: ["clubs.manage"],
    });
    expect(isAdminUser(user)).toBe(false);
  });

  it("is false for a null user", () => {
    expect(isAdminUser(null)).toBe(false);
  });
});
