export interface ScanResult {
  file: string;
  line: number;
  pattern: string;
  match: string;
}

const SECRET_PATTERNS: { name: string; regex: RegExp }[] = [
  { name: "Anthropic/OpenAI API key", regex: /sk-[a-zA-Z0-9]{32,}/g },
  { name: "GitHub PAT", regex: /ghp_[a-zA-Z0-9]{36}/g },
  { name: "GitHub OAuth token", regex: /gho_[a-zA-Z0-9]{36}/g },
  { name: "Slack bot token", regex: /xoxb-[0-9]+-[a-zA-Z0-9]+/g },
  { name: "Telegram bot token", regex: /[0-9]{8,10}:[a-zA-Z0-9_-]{35}/g },
  { name: "Bearer token", regex: /Bearer [a-zA-Z0-9\-._~+/]+=*/g },
  { name: "AWS credential", regex: /AWS_[A-Z_]+=\S+/g },
  { name: "Embedded URL credential", regex: /https?:\/\/[^:]+:[^@]+@/g },
  { name: "Private IP", regex: /(?:192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})/g },
  { name: "Generic secret assignment", regex: /(?:password|secret|token|api_key|apikey)\s*[:=]\s*["'][^"']{8,}["']/gi },
];

export function scanContent(content: string, fileName: string): ScanResult[] {
  const results: ScanResult[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const { name, regex } of SECRET_PATTERNS) {
      regex.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(line)) !== null) {
        results.push({
          file: fileName,
          line: i + 1,
          pattern: name,
          match: match[0].length > 40 ? match[0].slice(0, 37) + "..." : match[0],
        });
      }
    }
  }

  return results;
}
