import { describe, it, expect } from "vitest";
import { nextFlagSet } from "./flagsStore";

describe("nextFlagSet", () => {
  it("adds an id that is not yet flagged", () => {
    const result = nextFlagSet(new Set(["a"]), "b");
    expect([...result].sort()).toEqual(["a", "b"]);
  });

  it("removes an id that is already flagged (toggle off)", () => {
    const result = nextFlagSet(new Set(["a", "b"]), "a");
    expect([...result]).toEqual(["b"]);
  });

  it("does not mutate the input set", () => {
    const input = new Set(["a"]);
    nextFlagSet(input, "b");
    expect([...input]).toEqual(["a"]);
  });
});
