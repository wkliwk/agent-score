import { describe, it, expect } from "vitest";
import type { MockProfile } from "@/lib/mock-profiles";

// Minimal profile factory for testing sort logic
function makeProfile(username: string, importCount: number | undefined): MockProfile {
  return {
    username,
    avatarUrl: `https://github.com/${username}.png`,
    composite: 5,
    tier: "Intermediate",
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
    bundle:
      importCount !== undefined
        ? { fileCount: 1, importCount, inspiredByCount: 0 }
        : undefined,
  };
}

describe("explore page — imports sort comparator", () => {
  const sortByImports = (a: MockProfile, b: MockProfile) =>
    (b.bundle?.importCount ?? 0) - (a.bundle?.importCount ?? 0);

  it("sorts profiles with bundles by importCount descending", () => {
    const profiles = [
      makeProfile("low", 5),
      makeProfile("high", 42),
      makeProfile("mid", 17),
    ];
    const sorted = [...profiles].sort(sortByImports);
    expect(sorted.map((p) => p.username)).toEqual(["high", "mid", "low"]);
  });

  it("treats profiles without a bundle as 0 imports", () => {
    const profiles = [
      makeProfile("none", undefined),
      makeProfile("some", 3),
    ];
    const sorted = [...profiles].sort(sortByImports);
    expect(sorted[0].username).toBe("some");
    expect(sorted[1].username).toBe("none");
  });

  it("preserves relative order when importCounts are equal", () => {
    const profiles = [
      makeProfile("a", 10),
      makeProfile("b", 10),
    ];
    const sorted = [...profiles].sort(sortByImports);
    // Stable sort: original order preserved for equal keys
    expect(sorted.map((p) => p.username)).toEqual(["a", "b"]);
  });

  it("handles all profiles having no bundle", () => {
    const profiles = [
      makeProfile("x", undefined),
      makeProfile("y", undefined),
    ];
    const sorted = [...profiles].sort(sortByImports);
    expect(sorted).toHaveLength(2);
  });
});
