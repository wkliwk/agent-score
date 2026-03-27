export interface ScanResult {
  file: string;
  line: number;
  pattern: string;
  match: string;
  redactedAs: string;
}

export interface RedactionReport {
  file: string;
  original: string;
  redacted: string;
  results: ScanResult[];
}

interface PatternDef {
  name: string;
  regex: RegExp;
  redactType: string;
}

const SECRET_PATTERNS: PatternDef[] = [
  { name: "Anthropic/OpenAI API key", regex: /sk-[a-zA-Z0-9-]{32,}/g, redactType: "API_KEY" },
  { name: "GitHub PAT", regex: /ghp_[a-zA-Z0-9]{36}/g, redactType: "GITHUB_PAT" },
  { name: "GitHub OAuth token", regex: /gho_[a-zA-Z0-9]{36}/g, redactType: "GITHUB_TOKEN" },
  { name: "Slack bot token", regex: /xoxb-[0-9]+-[a-zA-Z0-9]+/g, redactType: "SLACK_TOKEN" },
  { name: "Telegram bot token", regex: /[0-9]{8,10}:[a-zA-Z0-9_-]{35}/g, redactType: "BOT_TOKEN" },
  { name: "Bearer token", regex: /Bearer [a-zA-Z0-9\-._~+/]+=*/g, redactType: "BEARER_TOKEN" },
  { name: "AWS credential", regex: /AWS_[A-Z_]+=\S+/g, redactType: "AWS_CREDENTIAL" },
  { name: "Embedded URL credential", regex: /https?:\/\/[^:]+:[^@]+@/g, redactType: "URL_CREDENTIAL" },
  { name: "Private IP", regex: /(?:192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})/g, redactType: "PRIVATE_IP" },
  { name: "Generic secret assignment", regex: /(?:password|secret|token|api_key|apikey)\s*[:=]\s*["'][^"']{8,}["']/gi, redactType: "SECRET" },
];

// Shannon entropy calculation
function shannonEntropy(str: string): number {
  const freq = new Map<string, number>();
  for (const ch of str) {
    freq.set(ch, (freq.get(ch) ?? 0) + 1);
  }
  let entropy = 0;
  for (const count of freq.values()) {
    const p = count / str.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

// Detect high-entropy strings in value positions (env vars, config values)
const VALUE_PATTERN = /(?:^|\s)(?:[A-Z_]{2,}|[\w]+)\s*[:=]\s*["']?([A-Za-z0-9+/=_\-]{20,})["']?/g;

function scanEntropy(line: string, lineNum: number, fileName: string): ScanResult[] {
  const results: ScanResult[] = [];
  VALUE_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = VALUE_PATTERN.exec(line)) !== null) {
    const value = match[1];
    if (value && shannonEntropy(value) > 4.0) {
      results.push({
        file: fileName,
        line: lineNum,
        pattern: "High-entropy string",
        match: value.length > 40 ? value.slice(0, 37) + "..." : value,
        redactedAs: "[REDACTED:HIGH_ENTROPY]",
      });
    }
  }
  return results;
}

export function scanContent(content: string, fileName: string): ScanResult[] {
  const results: ScanResult[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Regex pattern matching
    for (const { name, regex, redactType } of SECRET_PATTERNS) {
      regex.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(line)) !== null) {
        results.push({
          file: fileName,
          line: i + 1,
          pattern: name,
          match: match[0].length > 40 ? match[0].slice(0, 37) + "..." : match[0],
          redactedAs: `[REDACTED:${redactType}]`,
        });
      }
    }

    // Entropy analysis
    results.push(...scanEntropy(line, i + 1, fileName));
  }

  return results;
}

export function redactContent(content: string, fileName: string): RedactionReport {
  const results = scanContent(content, fileName);
  let redacted = content;

  // Apply redactions (process longer matches first to avoid overlapping replacements)
  const sortedResults = [...results].sort((a, b) => b.match.length - a.match.length);
  for (const r of sortedResults) {
    // Use the full match (before truncation) for replacement
    // Re-scan to get full matches
  }

  // Re-process line by line for accurate redaction
  const lines = content.split("\n");
  const redactedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Apply regex pattern redactions
    for (const { regex, redactType } of SECRET_PATTERNS) {
      regex.lastIndex = 0;
      line = line.replace(regex, `[REDACTED:${redactType}]`);
    }

    // Apply entropy redactions
    VALUE_PATTERN.lastIndex = 0;
    let entropyMatch: RegExpExecArray | null;
    const replacements: { from: string; to: string }[] = [];
    while ((entropyMatch = VALUE_PATTERN.exec(line)) !== null) {
      const value = entropyMatch[1];
      if (value && shannonEntropy(value) > 4.0) {
        replacements.push({ from: value, to: "[REDACTED:HIGH_ENTROPY]" });
      }
    }
    for (const { from, to } of replacements) {
      line = line.replace(from, to);
    }

    redactedLines.push(line);
  }

  // Add scanned header
  const today = new Date().toISOString().split("T")[0];
  const header = `# [AgentScore: Scanned and redacted on ${today}]`;
  redacted = results.length > 0
    ? `${header}\n${redactedLines.join("\n")}`
    : `${header}\n${content}`;

  return {
    file: fileName,
    original: content,
    redacted,
    results,
  };
}

export function scanFiles(files: Map<string, string>): ScanResult[] {
  const allResults: ScanResult[] = [];
  for (const [name, content] of files) {
    allResults.push(...scanContent(content, name));
  }
  return allResults;
}

export function redactFiles(files: Map<string, string>): RedactionReport[] {
  const reports: RedactionReport[] = [];
  for (const [name, content] of files) {
    reports.push(redactContent(content, name));
  }
  return reports;
}
