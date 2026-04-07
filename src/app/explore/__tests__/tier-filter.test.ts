import { describe, it, expect } from "vitest";
import type { MockProfile } from "@/lib/mock-profiles";
import type { TierLabel } from "@/lib/scoring/types";

function makeProfile(username: string, tier: TierLabel): MockProfile {
  return {
    username,
    avatarUrl: `https://github.com/${username}.png`,
    composite: 5,
    tier,
    tierDescription: "Building Momentum",
    personality: "",
    dimensions: [],
    agents: [],
    mcpServers: [],
    commands: [],
    hooks: [],
    strengths: [],
    growthAreas: [],
    nextSteps: [],
  };
}

function filterByTier(profiles: MockProfile[], tier: string | undefined): MockProfile[] {
  if (!tier || tier === "all") return profiles;
  return profiles.filter((p) => p.tier === tier);
}

const PROFILES: MockProfile[] = [
  makeProfile("a", "Beginner"),
  makeProfile("b", "Intermediate"),
  makeProfile("c", "Advanced"),
  makeProfile("d", "Expert"),
  makeProfile("e", "Master"),
  makeProfile("f", "Master"),
];

describe("explore page — tier filter", () => {
  it("returns all profiles when tier is 'all'", () => {
    expect(filterByTier(PROFILES, "all")).toHaveLength(6);
  });

  it("returns all profiles when tier is undefined", () => {
    expect(filterByTier(PROFILES, undefined)).toHaveLength(6);
  });

  it("filters to only Beginner profiles", () => {
    const result = filterByTier(PROFILES, "Beginner");
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe("a");
  });

  it("filters to only Master profiles", () => {
    const result = filterByTier(PROFILES, "Master");
    expect(result).toHaveLength(2);
    expect(result.map((p) => p.username)).toEqual(["e", "f"]);
  });

  it("returns empty array when no profiles match the tier", () => {
    const result = filterByTier([makeProfile("x", "Beginner")], "Expert");
    expect(result).toHaveLength(0);
  });

  it("composes correctly — tier filter applied after a pre-sorted list", () => {
    const sorted = [...PROFILES].reverse();
    const result = filterByTier(sorted, "Master");
    expect(result).toHaveLength(2);
    expect(result.map((p) => p.username)).toEqual(["f", "e"]);
  });
});
