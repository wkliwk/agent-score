#!/usr/bin/env node

import chalk from "chalk";
import { runExport } from "./commands/export.js";
import { runBundle } from "./commands/bundle.js";
import { runImport } from "./commands/import.js";
import { runLogin } from "./commands/login.js";
import { runLogout } from "./commands/logout.js";
import { runWhoami } from "./commands/whoami.js";

const VERSION = "0.3.0";

function printHelp(): void {
  process.stdout.write(
    chalk.bold.white("\nagentscore") +
      chalk.gray(` v${VERSION}`) +
      chalk.white(" — Score and share your Claude Code agent ecosystem\n\n") +
      chalk.bold("Commands:\n") +
      chalk.cyan("  export  ") +
      chalk.white("Scan ~/.claude/ and submit a manifest to AgentScore\n") +
      chalk.cyan("  bundle  ") +
      chalk.white("Package agents + skills into a shareable bundle\n") +
      chalk.cyan("  import  ") +
      chalk.white("Install another user's bundle into your setup\n") +
      chalk.cyan("  login   ") +
      chalk.white("Authenticate via GitHub device flow\n") +
      chalk.cyan("  logout  ") +
      chalk.white("Clear stored credentials\n") +
      chalk.cyan("  whoami  ") +
      chalk.white("Show the currently logged-in user\n\n") +
      chalk.bold("Export options:\n") +
      chalk.cyan("  --auto   ") +
      chalk.white("Skip review prompt and submit immediately\n") +
      chalk.cyan("  --save   ") +
      chalk.white("Save manifest to agentscore-manifest.json instead of submitting\n\n") +
      chalk.bold("Import options:\n") +
      chalk.cyan("  --slice=agents  ") +
      chalk.white("Import only agent files\n") +
      chalk.cyan("  --slice=skills  ") +
      chalk.white("Import only command/skill files\n") +
      chalk.cyan("  --rollback      ") +
      chalk.white("Undo the last import\n\n") +
      chalk.bold("Options:\n") +
      chalk.cyan("  --help     ") +
      chalk.white("Show this help message\n") +
      chalk.cyan("  --version  ") +
      chalk.white("Print the CLI version\n\n") +
      chalk.gray("Quick start:\n") +
      chalk.white("  npx agentscore export              ") +
      chalk.gray("# Score your setup\n") +
      chalk.white("  npx agentscore bundle              ") +
      chalk.gray("# Share your agents + skills\n") +
      chalk.white("  npx agentscore import @username     ") +
      chalk.gray("# Install someone's setup\n") +
      chalk.white("  npx agentscore import --rollback    ") +
      chalk.gray("# Undo last import\n\n") +
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
    case "export": {
      const flags = new Set(args.slice(1));
      await runExport({
        auto: flags.has("--auto"),
        save: flags.has("--save"),
      });
      break;
    }
    case "bundle":
      await runBundle();
      break;
    case "import": {
      const restArgs = args.slice(1);
      const flags = new Set(restArgs.filter((a) => a.startsWith("--")));
      const positional = restArgs.filter((a) => !a.startsWith("--"));

      let slice: "agents" | "skills" | undefined;
      for (const f of flags) {
        if (f === "--slice=agents") slice = "agents";
        else if (f === "--slice=skills") slice = "skills";
      }

      await runImport(positional[0] ?? "", {
        slice,
        rollback: flags.has("--rollback"),
      });
      break;
    }
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
