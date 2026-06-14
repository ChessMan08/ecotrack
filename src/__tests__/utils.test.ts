import {
  isValidEmail,
  sanitizeText,
  clamp,
  pct,
  capitalize,
  formatDate,
  formatRelativeTime,
  nanoid,
} from "../lib/utils";

describe("isValidEmail", () => {
  test("valid emails return true", () => {
    ["user@example.com", "a.b+c@d.org", "test123@test.co.uk"].forEach((e) =>
      expect(isValidEmail(e)).toBe(true)
    );
  });

  test("invalid emails return false", () => {
    ["notanemail", "missing@", "@missing.com", "no spaces@test.com", ""].forEach(
      (e) => expect(isValidEmail(e)).toBe(false)
    );
  });
});

describe("sanitizeText", () => {
  test("escapes HTML special characters", () => {
    const input = '<script>alert("xss")</script>';
    const result = sanitizeText(input);
    expect(result).not.toContain("<script>");
    expect(result).toContain("&lt;script&gt;");
  });

  test("escapes ampersands", () => {
    expect(sanitizeText("a & b")).toBe("a &amp; b");
  });

  test("escapes quotes", () => {
    expect(sanitizeText('"hello"')).toContain("&quot;");
  });

  test("plain text passes through unchanged", () => {
    expect(sanitizeText("hello world")).toBe("hello world");
  });
});

describe("clamp", () => {
  test("clamps below min", () => {
    expect(clamp(-5, 0, 100)).toBe(0);
  });

  test("clamps above max", () => {
    expect(clamp(150, 0, 100)).toBe(100);
  });

  test("passes through values in range", () => {
    expect(clamp(50, 0, 100)).toBe(50);
  });
});

describe("pct", () => {
  test("returns correct percentage", () => {
    expect(pct(25, 100)).toBe(25);
    expect(pct(1, 3)).toBeCloseTo(33.33, 1);
  });

  test("returns 0 for total = 0 (no divide by zero)", () => {
    expect(pct(50, 0)).toBe(0);
  });
});

describe("capitalize", () => {
  test("capitalizes first letter", () => {
    expect(capitalize("hello")).toBe("Hello");
  });

  test("handles empty string", () => {
    expect(capitalize("")).toBe("");
  });
});

describe("nanoid", () => {
  test("returns a string of default length 12", () => {
    const id = nanoid();
    expect(typeof id).toBe("string");
    expect(id).toHaveLength(12);
  });

  test("custom size works", () => {
    expect(nanoid(6)).toHaveLength(6);
    expect(nanoid(20)).toHaveLength(20);
  });

  test("generates unique IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, () => nanoid()));
    expect(ids.size).toBe(100);
  });
});

describe("formatDate", () => {
  test("returns a non-empty string", () => {
    const result = formatDate(new Date().toISOString());
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("formatRelativeTime", () => {
  test("returns 'just now' for recent timestamps", () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe("just now");
  });

  test("returns minutes ago for recent past", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60000).toISOString();
    expect(formatRelativeTime(fiveMinAgo)).toContain("m ago");
  });
});
