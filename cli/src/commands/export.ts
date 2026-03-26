import readline from "readline";
import chalk from "chalk";
import ora from "ora";
import { buildManifest, AgentScoreManifest } from "../scanner.js";
import { getToken, isTokenExpired } from "../auth.js";
import { runLogin } from "./login.js";

const API_URL = process.env["AGENTSCORE_API_URL"] ?? "https://agentscore.dev";

function colorizeManifest(manifest: AgentScoreManifest): string {
  const json = JSON.stringify(manifest, null, 2);
  return json
    .split("\n")
    .map((line) => {
      // Key lines
      if (/^\s+"[^"]+":/.test(line)) {
        return line.replace(/"([^"]+)"(:)/, (_, key, colon) => {
          return chalk.cyan(`"${key}"`) + chalk.white(colon);
        });
      }
      return chalk.white(line);
    })
    .join("\n");
}

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export async function runExport(): Promise<void> {
  // 1. Determine username from stored auth or prompt
  let auth = getToken();
  let username = auth?.username ?? "";
  let github = auth?.github;

  if (username === "") {
    username = await prompt(chalk.cyan("Enter your username for the manifest: "));
    username = username.trim();
    if (username === "") {
      process.stdout.write(chalk.red("Username is required.\n"));
      return;
    }
  }

  // 2. Build manifest
  const scanSpinner = ora("Scanning ~/.claude/ ...").start();
  let manifest: AgentScoreManifest;
  try {
    manifest = buildManifest(username, github);
    scanSpinner.succeed(chalk.green("Scan complete."));
  } catch (err) {
    scanSpinner.fail(chalk.red(`Scan failed: ${String(err)}`));
    return;
  }

  // 3. Pretty-print manifest
  process.stdout.write("\n" + colorizeManifest(manifest) + "\n\n");

  // 4. Confirm submission
  const answer = await prompt(chalk.bold("Submit this manifest to AgentScore? (y/n): "));
  if (answer.trim().toLowerCase() !== "y") {
    process.stdout.write(chalk.yellow("Submission cancelled.\n"));
    return;
  }

  // 5. Ensure auth — run login flow if needed
  auth = getToken();
  if (auth === null || isTokenExpired(auth)) {
    process.stdout.write(
      chalk.yellow("\nYou need to log in before submitting.\n\n")
    );
    await runLogin();
    auth = getToken();
    if (auth === null) {
      process.stdout.write(chalk.red("Login failed. Cannot submit manifest.\n"));
      return;
    }
  }

  // 6. POST manifest
  const submitSpinner = ora("Submitting manifest...").start();

  try {
    const res = await fetch(`${API_URL}/api/profiles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify(manifest),
    });

    if (!res.ok) {
      const body = await res.text();
      submitSpinner.fail(
        chalk.red(`Submission failed (${res.status}): ${body}`)
      );
      return;
    }

    const data = (await res.json()) as { profileUrl?: string; username?: string };
    submitSpinner.succeed(chalk.green("Manifest submitted successfully."));

    if (data.profileUrl !== undefined) {
      process.stdout.write(
        "\n" +
          chalk.cyan("Your profile: ") +
          chalk.bold.white(data.profileUrl) +
          "\n"
      );
    } else {
      process.stdout.write(
        "\n" +
          chalk.cyan("View your profile at: ") +
          chalk.bold.white(`${API_URL}/u/${manifest.username}`) +
          "\n"
      );
    }
  } catch (err) {
    submitSpinner.fail(chalk.red(`Network error: ${String(err)}`));
  }
}
