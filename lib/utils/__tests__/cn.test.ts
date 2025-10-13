import { describe, it, expect } from "vitest";
import { cn } from "../cn";

describe("cn utility", () => {
  it("should merge class names", () => {
    const result = cn("foo", "bar");
    expect(result).toBe("foo bar");
  });

  it("should handle conditional classes", () => {
    const result = cn("foo", false && "bar", "baz");
    expect(result).toBe("foo baz");
  });

  it("should concatenate classes (note: actual merging requires tailwind-merge)", () => {
    const result = cn("px-2 py-1", "px-4");
    // Without tailwind-merge, classes are concatenated, not merged
    expect(result).toBe("px-2 py-1 px-4");
  });

  it("should handle arrays", () => {
    const result = cn(["foo", "bar"], "baz");
    expect(result).toBe("foo bar baz");
  });

  it("should handle objects", () => {
    const result = cn({ foo: true, bar: false, baz: true });
    expect(result).toBe("foo baz");
  });

  it("should handle undefined and null", () => {
    const result = cn("foo", undefined, "bar", null, "baz");
    expect(result).toBe("foo bar baz");
  });
});
