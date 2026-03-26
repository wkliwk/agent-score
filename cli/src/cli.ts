#!/usr/bin/env node

import chalk from "chalk";
import { runExport } from "./commands/export.js";
import { runLogin } from "./commands/login.js";
import { runLogout } from "./commands/logout.js";
import { runWhoami } from "./commands/whoami.js";

const VERSION = "0.1.0";

function printHelp(): void {
  process.stdout.write(
    chalk.bold.white("\nagentscore") +
      chalk.gray(` v${VERSION}`) +
      chalk.white(" — Score and share your Claude Code agent ecosystem\n\n") +
      chalk.bold("Usage:\n") +
      chalk.white("  agentscore <command>\n\n") +
      chalk.bold("Commands:\n") +
      chalk.cyan("  export  ") +
      chalk.white("Scan ~/.claude/ and submit a manifest to AgentScore\n") +
      chalk.cyan("  login   ") +
      chalk.white("Authenticate via GitHub device flow\n") +
      chalk.cyan("  logout  ") +
      chalk.white("Clear stored credentials\n") +
      chalk.cyan("  whoami  ") +
      chalk.white("Show the currently logged-in user\n\n") +
      chalk.bold("Options:\n") +
      chalk.cyan("  --help     ") +
      chalk.white("Show this help message\n") +
      chalk.cyan("  --version  ") +
      chalk.white("Print the CLI version\n\n") +
      chalk.gray("Environment:\n") +
      chalk.gray("  AGENTSCORE_API_URL  Override API endpoint (default: https://agentscore.dev)\n") +
      "\n"
  );
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === "--version" || command === "-v") {
    process.stdout.write(`${VERSION}\n`);
    return;
  }

  if (command === "--help" || command === "-h" || command === undefined) {
    printHelp();
    return;
  }

  switch (command) {
    case "export":
      await runExport();
      break;
    case "login":
      await runLogin();
      break;
    case "logout":
      runLogout();
      break;
    case "whoami":
      runWhoami();
      break;
    default:
      process.stdout.write(
        chalk.red(`Unknown command: ${chalk.bold(command)}\n\n`)
      );
      printHelp();
      process.exit(1);
  }
}

main().catch((err: unknown) => {
  process.stderr.write(chalk.red(`Unexpected error: ${String(err)}\n`));
  process.exit(1);
});
