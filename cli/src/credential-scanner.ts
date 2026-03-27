import chalk from "chalk";

export interface ScanResult {
  file: string;
  line: number;
  pattern: string;
  match: string;
  redactedAs: string;
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

const VALUE_PATTERN = /(?:^|\s)(?:[A-Z_]{2,}|[\w]+)\s*[:=]\s*["']?([A-Za-z0-9+/=_\-]{20,})["']?/g;

export function scanContent(content: string, fileName: string): ScanResult[] {
  const results: ScanResult[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

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
    VALUE_PATTERN.lastIndex = 0;
    let entropyMatch: RegExpExecArray | null;
    while ((entropyMatch = VALUE_PATTERN.exec(line)) !== null) {
      const value = entropyMatch[1];
      if (value && shannonEntropy(value) > 4.0) {
        results.push({
          file: fileName,
          line: i + 1,
          pattern: "High-entropy string",
          match: value.length > 40 ? value.slice(0, 37) + "..." : value,
          redactedAs: "[REDACTED:HIGH_ENTROPY]",
        });
      }
    }
  }

  return results;
}

export function scanFiles(files: Map<string, string>): ScanResult[] {
  const allResults: ScanResult[] = [];
  for (const [name, content] of files) {
    allResults.push(...scanContent(content, name));
  }
  return allResults;
}

export function printScanResults(results: ScanResult[]): void {
  if (results.length === 0) {
    process.stdout.write(chalk.green("  No secrets detected.\n"));
    return;
  }

  process.stdout.write(chalk.red.bold(`  ${results.length} potential secret(s) found:\n\n`));
  for (const r of results) {
    process.stdout.write(
      chalk.red("  BLOCKED ") +
        chalk.white(`${r.file}:${r.line}`) +
        chalk.gray(` — ${r.pattern}`) +
        chalk.yellow(` → ${r.redactedAs}`) +
        "\n" +
        chalk.gray(`           ${r.match}\n\n`)
    );
  }
}
