import { z } from "zod";

/**
 * Zod schema for AgentScoreManifest.
 * Shape mirrors src/lib/scoring/types.ts — that file is the source of truth.
 */
export const agentScoreManifestSchema = z.object({
  version: z.string(),
  exportedAt: z.string(),
  generator: z.string(),
  username: z.string(),
  github: z.string(),
  agents: z.object({
    count: z.number().int().min(0),
    names: z.array(z.string()),
    hasSharedDir: z.boolean(),
  }),
  memory: z.object({
    hasMemoryMd: z.boolean(),
    memoryFileCount: z.number().int().min(0),
    memoryCategories: z.array(z.string()),
    projectMemoryDirs: z.number().int().min(0),
  }),
  mcpServers: z.object({
    count: z.number().int().min(0),
    names: z.array(z.string()),
  }),
  hooks: z.object({
    events: z.array(z.string()),
    totalHookCount: z.number().int().min(0),
    hasStatusLine: z.boolean(),
  }),
  commands: z.object({
    count: z.number().int().min(0),
    names: z.array(z.string()),
  }),
  projects: z.object({
    count: z.number().int().min(0),
    hasClaudeMd: z.boolean(),
  }),
  workflows: z.object({
    hasCronJobs: z.boolean(),
    hasPlugins: z.boolean(),
    pluginNames: z.array(z.string()),
    hasCustomProxy: z.boolean(),
    hasChannels: z.boolean(),
    channelTypes: z.array(z.string()),
  }),
});

export type AgentScoreManifestInput = z.infer<typeof agentScoreManifestSchema>;
