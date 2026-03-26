import type { NextRequest } from "next/server";
import { db } from "@/db";
import { deviceFlows } from "@/db/schema";
import type { DeviceFlowInitResponse } from "@/lib/types/auth";

const GITHUB_DEVICE_AUTH_URL = "https://github.com/login/device/code";

// ---------------------------------------------------------------------------
// POST /api/auth/device — initiate GitHub device flow
// ---------------------------------------------------------------------------
export async function POST(_req: NextRequest) {
  const clientId = process.env.GITHUB_DEVICE_CLIENT_ID;
  if (!clientId) {
    return Response.json(
      { error: "Device auth is not configured" },
      { status: 503 }
    );
  }

  const ghRes = await fetch(GITHUB_DEVICE_AUTH_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ client_id: clientId, scope: "read:user" }),
  });

  if (!ghRes.ok) {
    return Response.json(
      { error: "Failed to initiate device flow with GitHub" },
      { status: 502 }
    );
  }

  const ghData = (await ghRes.json()) as {
    device_code: string;
    user_code: string;
    verification_uri: string;
    expires_in: number;
    interval: number;
  };

  const expiresAt = new Date(Date.now() + ghData.expires_in * 1000);

  await db.insert(deviceFlows).values({
    deviceCode: ghData.device_code,
    userCode: ghData.user_code,
    expiresAt,
  });

  const response: DeviceFlowInitResponse = {
    deviceCode: ghData.device_code,
    userCode: ghData.user_code,
    verificationUri: ghData.verification_uri,
    expiresIn: ghData.expires_in,
    pollInterval: ghData.interval,
  };

  return Response.json(response, { status: 200 });
}
