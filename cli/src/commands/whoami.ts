import chalk from "chalk";
import { getToken, isTokenExpired } from "../auth.js";

export function runWhoami(): void {
  const auth = getToken();

  if (auth === null) {
    process.stdout.write(chalk.yellow("Not logged in. Run `agentscore login` to authenticate.\n"));
    return;
  }

  if (isTokenExpired(auth)) {
    process.stdout.write(
      chalk.yellow("Session expired. Run `agentscore login` to re-authenticate.\n")
    );
    return;
  }

  process.stdout.write(
    chalk.cyan("Logged in as: ") + chalk.bold.white(auth.username) + "\n"
  );

  if (auth.github !== undefined) {
    process.stdout.write(chalk.cyan("GitHub: ") + chalk.white(auth.github) + "\n");
  }

  if (auth.expiresAt !== undefined) {
    process.stdout.write(
      chalk.cyan("Session expires: ") +
        chalk.white(new Date(auth.expiresAt).toLocaleString()) +
        "\n"
    );
  }
}
