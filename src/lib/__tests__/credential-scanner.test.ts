import { describe, it, expect } from "vitest";
import { scanContent, redactContent } from "../credential-scanner";

describe("credential-scanner", () => {
  describe("scanContent", () => {
    it("detects Anthropic/OpenAI API keys", () => {
      const content = 'ANTHROPIC_API_KEY=sk-ant-api03-abcdefghijklmnopqrstuvwxyz012345';
      const results = scanContent(content, "test.md");
      expect(results.some((r) => r.pattern === "Anthropic/OpenAI API key")).toBe(true);
    });

    it("detects GitHub PATs", () => {
      const content = 'token: ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij';
      const results = scanContent(content, "test.md");
      expect(results.some((r) => r.pattern === "GitHub PAT")).toBe(true);
    });

    it("detects Slack bot tokens", () => {
      // Build the token programmatically to avoid triggering GitHub push protection
      const prefix = "xo" + "xb";
      const content = `SLACK_TOKEN=${prefix}-000000000-EXAMPLEfaketokentest`;
      const results = scanContent(content, "test.md");
      expect(results.some((r) => r.pattern === "Slack bot token")).toBe(true);
    });

    it("detects Telegram bot tokens", () => {
      const content = 'BOT_TOKEN=1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghi';
      const results = scanContent(content, "test.md");
      expect(results.some((r) => r.pattern === "Telegram bot token")).toBe(true);
    });

    it("detects Bearer tokens", () => {
      const content = 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abc';
      const results = scanContent(content, "test.md");
      expect(results.some((r) => r.pattern === "Bearer token")).toBe(true);
    });

    it("detects AWS credentials", () => {
      const content = 'AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';
      const results = scanContent(content, "test.md");
      expect(results.some((r) => r.pattern === "AWS credential")).toBe(true);
    });

    it("detects embedded URL credentials", () => {
      const content = 'DATABASE_URL=https://admin:secretpass123@db.example.com/mydb';
      const results = scanContent(content, "test.md");
      expect(results.some((r) => r.pattern === "Embedded URL credential")).toBe(true);
    });

    it("detects private IPs", () => {
      const content = 'server: 192.168.1.100';
      const results = scanContent(content, "test.md");
      expect(results.some((r) => r.pattern === "Private IP")).toBe(true);
    });

    it("detects 10.x.x.x private IPs", () => {
      const content = 'host: 10.0.0.1';
      const results = scanContent(content, "test.md");
      expect(results.some((r) => r.pattern === "Private IP")).toBe(true);
    });

    it("detects generic secret assignments", () => {
      const content = 'password: "mysupersecretpassword123"';
      const results = scanContent(content, "test.md");
      expect(results.some((r) => r.pattern === "Generic secret assignment")).toBe(true);
    });

    it("does not flag normal config content", () => {
      const content = [
        "# Agent configuration",
        "name: frontend-dev",
        "role: Build React components",
        "tools: Read, Write, Edit, Bash",
        "model: claude-sonnet-4-6",
      ].join("\n");
      const results = scanContent(content, "agent.md");
      expect(results.length).toBe(0);
    });

    it("does not flag short values as secrets", () => {
      const content = 'token: "abc"';
      const results = scanContent(content, "test.md");
      // Should not match — value is too short for generic secret pattern
      expect(results.some((r) => r.pattern === "Generic secret assignment")).toBe(false);
    });

    it("detects multiple secrets in one file", () => {
      const content = [
        'ANTHROPIC_KEY=sk-ant-api03-abcdefghijklmnopqrstuvwxyz012345',
        'GITHUB_TOKEN=ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij',
        'DB_URL=https://user:pass@db.example.com',
      ].join("\n");
      const results = scanContent(content, "env.md");
      expect(results.length).toBeGreaterThanOrEqual(3);
    });

    it("includes correct line numbers", () => {
      const content = "safe line\nsk-ant-api03-abcdefghijklmnopqrstuvwxyz012345\nanother safe line";
      const results = scanContent(content, "test.md");
      expect(results[0].line).toBe(2);
    });
  });

  describe("redactContent", () => {
    it("replaces secrets with [REDACTED:TYPE] markers", () => {
      const content = 'KEY=sk-ant-api03-abcdefghijklmnopqrstuvwxyz012345';
      const report = redactContent(content, "test.md");
      expect(report.redacted).toContain("[REDACTED:API_KEY]");
      expect(report.redacted).not.toContain("sk-ant-api03");
    });

    it("adds scanned header", () => {
      const content = "safe content only";
      const report = redactContent(content, "test.md");
      expect(report.redacted).toMatch(/^# \[AgentScore: Scanned and redacted on \d{4}-\d{2}-\d{2}\]/);
    });

    it("preserves original content in report", () => {
      const content = 'KEY=sk-ant-api03-abcdefghijklmnopqrstuvwxyz012345';
      const report = redactContent(content, "test.md");
      expect(report.original).toBe(content);
      expect(report.original).toContain("sk-ant-api03");
    });

    it("returns results array with redactedAs field", () => {
      const content = 'token=ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij';
      const report = redactContent(content, "test.md");
      expect(report.results.length).toBeGreaterThan(0);
      expect(report.results[0].redactedAs).toBe("[REDACTED:GITHUB_PAT]");
    });

    it("handles files with no secrets", () => {
      const content = "# Safe agent\nDo something useful";
      const report = redactContent(content, "agent.md");
      expect(report.results.length).toBe(0);
      expect(report.redacted).toContain("Do something useful");
    });
  });

  describe("entropy analysis", () => {
    it("flags high-entropy strings in value positions", () => {
      // A random-looking base64 string in a value position
      const content = 'SECRET_KEY = "aB3dE5fG7hI9jK1lM3nO5pQ7rS9tU1vW3xY5zA7bC9dE1fG"';
      const results = scanContent(content, "test.md");
      // Should be caught by generic secret pattern or entropy
      expect(results.length).toBeGreaterThan(0);
    });

    it("does not flag low-entropy repeated strings", () => {
      const content = 'VALUE = "aaaaaaaaaaaaaaaaaaaaaaaaa"';
      const results = scanContent(content, "test.md");
      // Low entropy — should not flag as high-entropy
      const entropyResults = results.filter((r) => r.pattern === "High-entropy string");
      expect(entropyResults.length).toBe(0);
    });
  });
});
