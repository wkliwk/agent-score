import {
  pgTable,
  uuid,
  text,
  real,
  integer,
  jsonb,
  timestamp,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const visibilityEnum = pgEnum("visibility", ["public", "unlisted"]);

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    githubId: text("github_id").notNull(),
    githubLogin: text("github_login").notNull(),
    displayName: text("display_name").notNull(),
    avatarUrl: text("avatar_url"),
    bio: text("bio"),
    visibility: visibilityEnum("visibility").notNull().default("public"),
    totalScore: real("total_score"),
    tier: text("tier"),
    dimensionScores: jsonb("dimension_scores"),
    manifestSnapshot: jsonb("manifest_snapshot"),
    scoredAt: timestamp("scored_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    githubIdIdx: uniqueIndex("profiles_github_id_idx").on(table.githubId),
    githubLoginIdx: uniqueIndex("profiles_github_login_idx").on(
      table.githubLogin
    ),
    totalScoreIdx: index("profiles_total_score_idx").on(table.totalScore),
  })
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    sessionToken: text("session_token").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    sessionTokenIdx: uniqueIndex("sessions_token_idx").on(table.sessionToken),
    profileIdIdx: index("sessions_profile_id_idx").on(table.profileId),
  })
);

export const deviceFlows = pgTable(
  "device_flows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    deviceCode: text("device_code").notNull(),
    userCode: text("user_code").notNull(),
    profileId: uuid("profile_id").references(() => profiles.id, {
      onDelete: "cascade",
    }),
    sessionToken: text("session_token"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    deviceCodeIdx: uniqueIndex("device_flows_device_code_idx").on(
      table.deviceCode
    ),
    userCodeIdx: index("device_flows_user_code_idx").on(table.userCode),
  })
);

export const scoreHistory = pgTable(
  "score_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    totalScore: real("total_score").notNull(),
    dimensionScores: jsonb("dimension_scores").notNull(),
    scoredAt: timestamp("scored_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    profileIdIdx: index("score_history_profile_id_idx").on(table.profileId),
    scoredAtIdx: index("score_history_scored_at_idx").on(table.scoredAt),
  })
);

export const bundles = pgTable(
  "bundles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    username: text("username").notNull(),
    description: text("description"),
    files: jsonb("files").notNull(),
    slices: jsonb("slices").notNull(),
    importCount: integer("import_count").notNull().default(0),
    inspiredBy: jsonb("inspired_by").notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    usernameIdx: uniqueIndex("bundles_username_idx").on(table.username),
    profileIdIdx: index("bundles_profile_id_idx").on(table.profileId),
  })
);
