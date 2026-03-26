export interface AuthSession {
  profileId: string;
  githubLogin: string;
  displayName: string;
  avatarUrl: string | null;
  sessionToken: string;
  expiresAt: string;
}

export interface CLIAuthToken {
  sessionToken: string;
  profileId: string;
  githubLogin: string;
  expiresAt: string;
}

export interface DeviceFlowInitResponse {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  expiresIn: number;
  pollInterval: number;
}

export type DeviceFlowPollResponse =
  | { status: "pending" }
  | { status: "expired" }
  | { status: "authorized"; token: CLIAuthToken };
