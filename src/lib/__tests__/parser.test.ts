import { describe, it, expect } from "vitest";
import {
  parseAmount,
  parseTransactionMessage,
  fuzzyMatchCategory,
  getSuggestions,
} from "../parser";

// ─── parseAmount ──────────────────────────────────────────────────────────────

describe("parseAmount", () => {
  it("parses plain integer", () => {
    expect(parseAmount("50000")).toBe(50000);
  });

  it("parses number with dots (Indonesian thousand separator)", () => {
    expect(parseAmount("50.000")).toBe(50000);
    expect(parseAmount("1.500.000")).toBe(1500000);
  });

  it("parses 'k' suffix", () => {
    expect(parseAmount("25k")).toBe(25000);
    expect(parseAmount("100k")).toBe(100000);
  });

  it("parses 'rb' (ribu) suffix", () => {
    expect(parseAmount("50rb")).toBe(50000);
  });

  it("parses 'ribu' suffix", () => {
    expect(parseAmount("50ribu")).toBe(50000);
  });

  it("parses 'jt' (juta) suffix", () => {
    expect(parseAmount("1jt")).toBe(1000000);
    expect(parseAmount("2jt")).toBe(2000000);
  });

  it("parses decimal juta", () => {
    expect(parseAmount("1.5jt")).toBe(1500000);
    expect(parseAmount("2.5jt")).toBe(2500000);
  });

  it("returns null for non-numeric input", () => {
    expect(parseAmount("abcd")).toBeNull();
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("nasi")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseAmount("")).toBeNull();
  });
});

// ─── parseTransactionMessage ──────────────────────────────────────────────────

describe("parseTransactionMessage", () => {
  it("parses basic message: category + amount", () => {
    const result = parseTransactionMessage("makan 50000");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.categoryRaw).toBe("makan");
    expect(result.data.amount).toBe(50000);
    expect(result.data.note).toBeUndefined();
  });

  it("parses message with note", () => {
    const result = parseTransactionMessage("makan 50000 nasi padang");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.categoryRaw).toBe("makan");
    expect(result.data.amount).toBe(50000);
    expect(result.data.note).toBe("nasi padang");
  });

  it("parses uppercase input", () => {
    const result = parseTransactionMessage("JAJAN 25000 Kopi Susu");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.categoryRaw).toBe("jajan");
    expect(result.data.amount).toBe(25000);
    expect(result.data.note).toBe("kopi susu");
  });

  it("parses 'k' shorthand amount", () => {
    const result = parseTransactionMessage("jajan 25k kopi");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.amount).toBe(25000);
  });

  it("parses juta shorthand", () => {
    const result = parseTransactionMessage("belanja 1.5jt baju lebaran");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.amount).toBe(1500000);
    expect(result.data.note).toBe("baju lebaran");
  });

  it("handles excess whitespace", () => {
    const result = parseTransactionMessage("  makan   50000   nasi  ");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.categoryRaw).toBe("makan");
    expect(result.data.note).toBe("nasi");
  });

  it("returns format error for single token", () => {
    const result = parseTransactionMessage("makan");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("format");
  });

  it("returns format error for empty string", () => {
    const result = parseTransactionMessage("");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("format");
  });

  it("returns amount_invalid when amount is not a number", () => {
    const result = parseTransactionMessage("makan nasipadang");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("amount_invalid");
  });

  it("returns amount_zero for zero amount", () => {
    const result = parseTransactionMessage("makan 0");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("amount_zero");
  });

  it("returns amount_zero for negative amount (parsed as 0)", () => {
    // "-5000" setelah replace(/\./g,'') tetap -5000 → parseFloat OK tapi ≤ 0
    const result = parseTransactionMessage("makan -5000");
    expect(result.ok).toBe(false);
  });
});

// ─── fuzzyMatchCategory ───────────────────────────────────────────────────────

describe("fuzzyMatchCategory", () => {
  const categories = ["Makan", "Jajan", "Belanja", "Transportasi", "Tagihan"];

  it("returns exact match", () => {
    const result = fuzzyMatchCategory("makan", categories);
    expect(result).not.toBeNull();
    expect(result!.match).toBe("Makan");
    expect(result!.distance).toBe(0);
  });

  it("matches typo with distance 1", () => {
    const result = fuzzyMatchCategory("mkaan", categories); // transposisi
    expect(result).not.toBeNull();
    expect(result!.match).toBe("Makan");
  });

  it("matches 'blnja' to 'Belanja'", () => {
    const result = fuzzyMatchCategory("blnja", categories, 4);
    expect(result).not.toBeNull();
    expect(result!.match).toBe("Belanja");
  });

  it("returns null when no match within threshold", () => {
    const result = fuzzyMatchCategory("xyz123", categories, 3);
    expect(result).toBeNull();
  });

  it("returns closest match when multiple candidates", () => {
    // "jaan" lebih dekat ke "Jajan" (dist 1) daripada "Makan" (dist 4)
    const result = fuzzyMatchCategory("jaan", categories);
    expect(result!.match).toBe("Jajan");
  });
});

// ─── getSuggestions ───────────────────────────────────────────────────────────

describe("getSuggestions", () => {
  const categories = ["Makan", "Jajan", "Belanja", "Transportasi"];

  it("returns up to maxSuggestions results", () => {
    const result = getSuggestions("mkan", categories, 2, 4);
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it("returns empty array when no match", () => {
    const result = getSuggestions("zzzzzzz", categories, 3, 2);
    expect(result).toEqual([]);
  });

  it("sorts by distance ascending", () => {
    const result = getSuggestions("makan", categories, 3, 5);
    // "Makan" harus di posisi pertama (distance 0)
    expect(result[0]).toBe("Makan");
  });
});
