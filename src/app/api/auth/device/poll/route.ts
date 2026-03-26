import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { deviceFlows, profiles, sessions } from "@/db/schema";
import { randomUUID } from "crypto";
import type { CLIAuthToken, DeviceFlowPollResponse } from "@/lib/types/auth";

const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_USER_URL = "https://api.github.com/user";

interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
}

// ---------------------------------------------------------------------------
// POST /api/auth/device/poll — poll for device flow completion
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return Response.json({ error: "Request body must be an object" }, { status: 400 });
  }

  const { deviceCode } = body as Record<string, unknown>;

  if (typeof deviceCode !== "string" || deviceCode.trim() === "") {
    return Response.json({ error: "deviceCode is required" }, { status: 422 });
  }

  const flows = await db
    .select()
    .from(deviceFlows)
    .where(eq(deviceFlows.deviceCode, deviceCode))
    .limit(1);

  if (flows.length === 0) {
    return Response.json({ error: "Device flow not found" }, { status: 404 });
  }

  const flow = flows[0];
  const now = new Date();

  // Already authorized — return existing session token
  if (flow.verifiedAt !== null && flow.sessionToken !== null) {
    const sessionRows = await db
      .select({ profileId: sessions.profileId, expiresAt: sessions.expiresAt })
      .from(sessions)
      .where(eq(sessions.sessionToken, flow.sessionToken))
      .limit(1);

    if (sessionRows.length === 0) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    const profileRows = await db
      .select({ githubLogin: profiles.githubLogin })
      .from(profiles)
      .where(eq(profiles.id, sessionRows[0].profileId))
      .limit(1);

    const token: CLIAuthToken = {
      sessionToken: flow.sessionToken,
      profileId: sessionRows[0].profileId,
      githubLogin: profileRows[0]?.githubLogin ?? "",
      expiresAt: sessionRows[0].expiresAt.toISOString(),
    };

    const response: DeviceFlowPollResponse = { status: "authorized", token };
    return Response.json(response);
  }

  // Expired
  if (flow.expiresAt < now) {
    const response: DeviceFlowPollResponse = { status: "expired" };
    return Response.json(response);
  }

  // Poll GitHub token endpoint
  const clientId = process.env.GITHUB_DEVICE_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return Response.json({ error: "Device auth is not configured" }, { status: 503 });
  }

  const ghRes = await fetch(GITHUB_TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      device_code: deviceCode,
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
    }),
  });

  if (!ghRes.ok) {
    return Response.json({ error: "Failed to poll GitHub token" }, { status: 502 });
  }

  const ghData = (await ghRes.json()) as {
    access_token?: string;
    error?: string;
  };

  if (ghData.error === "authorization_pending" || !ghData.access_token) {
    const response: DeviceFlowPollResponse = { status: "pending" };
    return Response.json(response);
  }

  if (ghData.error) {
    const response: DeviceFlowPollResponse = { status: "expired" };
    return Response.json(response);
  }

  // Fetch GitHub user info
  const userRes = await fetch(GITHUB_USER_URL, {
    headers: {
      Authorization: `Bearer ${ghData.access_token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!userRes.ok) {
    return Response.json({ error: "Failed to fetch GitHub user info" }, { status: 502 });
  }

  const ghUser = (await userRes.json()) as GitHubUser;
  const githubId = String(ghUser.id);

  // Upsert profile
  const existingProfiles = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.githubId, githubId))
    .limit(1);

  let profileId: string;

  if (existingProfiles.length > 0) {
    profileId = existingProfiles[0].id;
    await db
      .update(profiles)
      .set({
        githubLogin: ghUser.login,
        displayName: ghUser.name ?? ghUser.login,
        avatarUrl: ghUser.avatar_url,
        bio: ghUser.bio,
        updatedAt: now,
      })
      .where(eq(profiles.githubId, githubId));
  } else {
    const inserted = await db
      .insert(profiles)
      .values({
        githubId,
        githubLogin: ghUser.login,
        displayName: ghUser.name ?? ghUser.login,
        avatarUrl: ghUser.avatar_url,
        bio: ghUser.bio,
      })
      .returning({ id: profiles.id });
    profileId = inserted[0].id;
  }

  // Create session — 30 day expiry
  const sessionToken = randomUUID();
  const sessionExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({
    profileId,
    sessionToken,
    expiresAt: sessionExpiry,
  });

  // Mark device flow as verified
  await db
    .update(deviceFlows)
    .set({ verifiedAt: now, sessionToken, profileId })
    .where(eq(deviceFlows.deviceCode, deviceCode));

  const token: CLIAuthToken = {
    sessionToken,
    profileId,
    githubLogin: ghUser.login,
    expiresAt: sessionExpiry.toISOString(),
  };

  const response: DeviceFlowPollResponse = { status: "authorized", token };
  return Response.json(response);
}
