export interface AgentScoreManifest {
  version: string;
  generatedAt: string;
  environment: {
    platform: string;
    shell: string;
    nodeVersion?: string;
  };
  mcpServers: {
    name: string;
    transport: string;
    command?: string;
    url?: string;
    tools?: string[];
  }[];
  memoryFiles: {
    path: string;
    sizeBytes: number;
    lastModified: string;
  }[];
  claudeMd: {
    exists: boolean;
    sizeBytes: number;
    sections: string[];
  };
  tools: {
    name: string;
    enabled: boolean;
    source: "builtin" | "mcp";
  }[];
  customInstructions: {
    count: number;
    categories: string[];
  };
  projectContext: {
    hasGitRepo: boolean;
    language?: string;
    framework?: string;
    packageManager?: string;
  };
}
