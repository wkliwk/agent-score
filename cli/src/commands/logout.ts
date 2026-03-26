import chalk from "chalk";
import { clearToken, getToken } from "../auth.js";

export function runLogout(): void {
  const existing = getToken();
  if (existing === null) {
    process.stdout.write(chalk.yellow("No active session found.\n"));
    return;
  }
  clearToken();
  process.stdout.write(
    chalk.green(`Logged out${existing.username ? ` (was ${chalk.bold(existing.username)})` : ""}.`) +
      "\n"
  );
}
