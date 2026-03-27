import fs from "fs";
import path from "path";
import os from "os";
import readline from "readline";
import chalk from "chalk";
import ora from "ora";
import type { Bundle, BundleFile } from "./bundle.js";

const CLAUDE_DIR = path.join(os.homedir(), ".claude");
const API_URL = process.env["AGENTSCORE_API_URL"] ?? "https://agentscore.dev";
const BACKUP_DIR = path.join(CLAUDE_DIR, ".agentscore-backup");

export interface ImportOptions {
  slice?: "agents" | "skills";
  rollback: boolean;
}

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => { rl.close(); resolve(answer); });
  });
}

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function fileExists(filePath: string): boolean {
  try { fs.accessSync(filePath); return true; } catch { return false; }
}

function backupFile(relativePath: string): void {
  const src = path.join(CLAUDE_DIR, relativePath);
  if (!fileExists(src)) return;

  const dest = path.join(BACKUP_DIR, relativePath);
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function restoreBackup(): { restored: number; failed: number } {
  if (!fs.existsSync(BACKUP_DIR)) {
    return { restored: 0, failed: 0 };
  }

  let restored = 0;
  let failed = 0;

  function walkDir(dir: string, base: string): void {
    for (const entry of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, entry);
      const relativePath = path.join(base, entry);

      if (fs.statSync(fullPath).isDirectory()) {
        walkDir(fullPath, relativePath);
      } else {
        const dest = path.join(CLAUDE_DIR, relativePath);
        try {
          ensureDir(path.dirname(dest));
          fs.copyFileSync(fullPath, dest);
          restored++;
        } catch {
          failed++;
        }
      }
    }
  }

  walkDir(BACKUP_DIR, "");

  // Also restore files that were newly created (not backed up) — delete them
  // This is tracked in the manifest file
  const manifestPath = path.join(BACKUP_DIR, "_import-manifest.json");
  if (fileExists(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as { newFiles: string[] };
      for (const f of manifest.newFiles) {
        const fullPath = path.join(CLAUDE_DIR, f);
        if (fileExists(fullPath)) {
          fs.unlinkSync(fullPath);
          restored++;
        }
      }
    } catch {
      // manifest parse failed
    }
  }

  // Clean up backup dir
  fs.rmSync(BACKUP_DIR, { recursive: true, force: true });

  return { restored, failed };
}

function filterBySlice(files: BundleFile[], slice?: "agents" | "skills"): BundleFile[] {
  if (!slice) return files;
  if (slice === "agents") return files.filter((f) => f.category === "agent");
  if (slice === "skills") return files.filter((f) => f.category === "command");
  return files;
}

export async function runImport(target: string, options: ImportOptions): Promise<void> {
  // Handle rollback
  if (options.rollback) {
    process.stdout.write(chalk.bold("\nRolling back last import...\n"));
    const { restored, failed } = restoreBackup();
    if (restored === 0 && failed === 0) {
      process.stdout.write(chalk.yellow("No backup found. Nothing to rollback.\n"));
    } else if (failed === 0) {
      process.stdout.write(chalk.green(`Restored ${restored} file(s). Rollback complete.\n`));
    } else {
      process.stdout.write(chalk.yellow(`Restored ${restored}, failed ${failed}. Check ~/.claude/ manually.\n`));
    }
    return;
  }

  // Parse @username
  const username = target.startsWith("@") ? target.slice(1) : target;
  if (username === "") {
    process.stdout.write(chalk.red("Usage: agentscore import @username [--slice=agents|skills]\n"));
    return;
  }

  // Fetch bundle
  const fetchSpinner = ora(`Fetching bundle for @${username}...`).start();
  let bundle: Bundle;
  try {
    const res = await fetch(`${API_URL}/api/bundles/${username}`);
    if (!res.ok) {
      fetchSpinner.fail(chalk.red(`Bundle not found for @${username} (${res.status})`));
      return;
    }
    bundle = (await res.json()) as Bundle;
    fetchSpinner.succeed(chalk.green(`Bundle loaded: ${bundle.files.length} files from @${username}`));
  } catch (err) {
    fetchSpinner.fail(chalk.red(`Network error: ${String(err)}`));
    return;
  }

  // Filter by slice
  const files = filterBySlice(bundle.files, options.slice);
  if (files.length === 0) {
    process.stdout.write(chalk.yellow(`\nNo ${options.slice ?? "files"} in @${username}'s bundle.\n`));
    return;
  }

  // Warning
  process.stdout.write(
    chalk.yellow.bold("\n  Warning: ") +
      chalk.yellow("These files influence Claude's behavior — review carefully.\n\n")
  );

  // Per-file confirmation
  const newFiles: string[] = [];
  const installedFiles: string[] = [];

  // Clean up old backup
  if (fs.existsSync(BACKUP_DIR)) {
    fs.rmSync(BACKUP_DIR, { recursive: true, force: true });
  }
  ensureDir(BACKUP_DIR);

  for (const file of files) {
    const destRelative = file.path;
    const destFull = path.join(CLAUDE_DIR, destRelative);
    const exists = fileExists(destFull);
    const status = exists ? chalk.yellow("OVERWRITE") : chalk.green("NEW");

    process.stdout.write(chalk.bold(`  ${status} `) + chalk.white(destRelative) + "\n");

    // Show preview (first 10 lines)
    const preview = file.content.split("\n").slice(0, 10);
    for (const line of preview) {
      process.stdout.write(chalk.gray(`    │ ${line}\n`));
    }
    if (file.content.split("\n").length > 10) {
      process.stdout.write(chalk.gray(`    │ ... (${file.content.split("\n").length - 10} more lines)\n`));
    }

    const answer = await prompt(chalk.bold("  Install this file? (y/n/q): "));
    const choice = answer.trim().toLowerCase();

    if (choice === "q") {
      process.stdout.write(chalk.yellow("\nImport cancelled.\n"));
      // Rollback any installed files
      if (installedFiles.length > 0) {
        restoreBackup();
        process.stdout.write(chalk.gray("Rolled back installed files.\n"));
      }
      return;
    }

    if (choice !== "y") {
      process.stdout.write(chalk.gray("  Skipped.\n\n"));
      continue;
    }

    // Backup existing file
    if (exists) {
      backupFile(destRelative);
    } else {
      newFiles.push(destRelative);
    }

    // Install
    ensureDir(path.dirname(destFull));
    fs.writeFileSync(destFull, file.content);
    installedFiles.push(destRelative);
    process.stdout.write(chalk.green("  Installed.\n\n"));
  }

  // Save import manifest for rollback
  fs.writeFileSync(
    path.join(BACKUP_DIR, "_import-manifest.json"),
    JSON.stringify({ newFiles, source: username, importedAt: new Date().toISOString() }, null, 2)
  );

  if (installedFiles.length === 0) {
    process.stdout.write(chalk.yellow("No files installed.\n"));
    fs.rmSync(BACKUP_DIR, { recursive: true, force: true });
    return;
  }

  process.stdout.write(
    chalk.green.bold(`\n  Imported ${installedFiles.length} file(s) from @${username}\n\n`) +
      chalk.gray("  To undo: ") + chalk.white("agentscore import --rollback") + "\n" +
      chalk.gray("  To see score change: ") + chalk.white("agentscore export") + "\n\n"
  );
}
