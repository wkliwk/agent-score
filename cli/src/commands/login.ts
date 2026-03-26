import chalk from "chalk";
import ora from "ora";
import open from "open";
import { saveToken } from "../auth.js";

const API_URL = process.env["AGENTSCORE_API_URL"] ?? "https://agentscore.dev";

interface DeviceResponse {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  expiresIn: number;
  interval: number;
}

interface PollResponse {
  status: "pending" | "complete" | "expired";
  token?: string;
  username?: string;
  github?: string;
  expiresAt?: string;
}

export async function runLogin(): Promise<void> {
  const spinner = ora("Initiating GitHub device flow...").start();

  let deviceData: DeviceResponse;

  try {
    const res = await fetch(`${API_URL}/api/auth/device`, { method: "POST" });
    if (!res.ok) {
      spinner.fail(chalk.red(`Device flow failed: ${res.status} ${res.statusText}`));
      return;
    }
    deviceData = (await res.json()) as DeviceResponse;
  } catch (err) {
    spinner.fail(chalk.red(`Could not reach AgentScore API: ${String(err)}`));
    return;
  }

  spinner.stop();

  process.stdout.write(
    chalk.cyan("\nOpen the following URL to authenticate:\n") +
      chalk.bold.white(`  ${deviceData.verificationUri}\n\n`) +
      chalk.cyan("Enter code: ") +
      chalk.bold.yellow(deviceData.userCode) +
      "\n\n"
  );

  try {
    await open(deviceData.verificationUri);
  } catch {
    // Non-fatal — user can open manually
  }

  const pollSpinner = ora("Waiting for GitHub authorisation...").start();
  const intervalMs = (deviceData.interval ?? 5) * 1000;
  const expiresAt = Date.now() + deviceData.expiresIn * 1000;

  while (Date.now() < expiresAt) {
    await sleep(intervalMs);

    let poll: PollResponse;
    try {
      const res = await fetch(`${API_URL}/api/auth/device/poll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceCode: deviceData.deviceCode }),
      });
      poll = (await res.json()) as PollResponse;
    } catch {
      continue;
    }

    if (poll.status === "complete" && poll.token !== undefined) {
      saveToken({
        token: poll.token,
        username: poll.username ?? "",
        ...(poll.github !== undefined ? { github: poll.github } : {}),
        ...(poll.expiresAt !== undefined ? { expiresAt: poll.expiresAt } : {}),
      });
      pollSpinner.succeed(
        chalk.green(`Logged in as ${chalk.bold(poll.username ?? poll.github ?? "unknown")}`)
      );
      return;
    }

    if (poll.status === "expired") {
      pollSpinner.fail(chalk.red("Device code expired. Run `agentscore login` again."));
      return;
    }
  }

  pollSpinner.fail(chalk.red("Timed out waiting for authorisation."));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
