import type { BenchmarkTask } from "./types";

export const BENCHMARK_TASKS: BenchmarkTask[] = [
  {
    id: "file-creation",
    title: "File Creation",
    description:
      "Create a file at a specific path with exact content. Tests whether CC uses the Write tool correctly.",
    prompt: `Create a file at /tmp/agentscore-test.txt with exactly this content (no extra whitespace or newlines):
Hello from AgentScore benchmark

After creating the file, report what you did.`,
    outputTemplate: JSON.stringify(
      {
        tool_used: "<Write or Bash or other>",
        file_path: "</tmp/agentscore-test.txt or other>",
        file_content: "<paste the content you wrote>",
      },
      null,
      2
    ),
    rubric: [
      {
        id: "correct-tool",
        description: "Used the Write tool (not Bash with echo/cat)",
        check: (output) => {
          const tool = (output.tool_used ?? "").toLowerCase().trim();
          return tool === "write";
        },
      },
      {
        id: "correct-path",
        description: "File path is /tmp/agentscore-test.txt",
        check: (output) =>
          (output.file_path ?? "").trim() === "/tmp/agentscore-test.txt",
      },
      {
        id: "correct-content",
        description: "File content matches exactly",
        check: (output) =>
          (output.file_content ?? "").trim() ===
          "Hello from AgentScore benchmark",
      },
    ],
  },
  {
    id: "file-read",
    title: "File Read + Extract",
    description:
      "Read a fixture and extract a specific value. Tests Read tool usage and comprehension.",
    prompt: `Read the file /tmp/agentscore-test.txt that was created in the previous task. What is the exact content of that file? Report the tool you used and the content.`,
    outputTemplate: JSON.stringify(
      {
        tool_used: "<Read or Bash or other>",
        file_content: "<exact content of the file>",
      },
      null,
      2
    ),
    rubric: [
      {
        id: "correct-tool",
        description: "Used the Read tool (not Bash with cat/head/tail)",
        check: (output) => {
          const tool = (output.tool_used ?? "").toLowerCase().trim();
          return tool === "read";
        },
      },
      {
        id: "correct-content",
        description: "Extracted correct file content",
        check: (output) =>
          (output.file_content ?? "").trim() ===
          "Hello from AgentScore benchmark",
      },
    ],
  },
  {
    id: "bash-execution",
    title: "Bash Execution",
    description:
      "Run a deterministic shell command and report the output. Tests Bash tool usage.",
    prompt: `Run this exact shell command and report the output:
echo "AgentScore" | wc -c

Report the tool used and the exact numeric output.`,
    outputTemplate: JSON.stringify(
      {
        tool_used: "<Bash or other>",
        command_output: "<the number output by wc -c>",
      },
      null,
      2
    ),
    rubric: [
      {
        id: "correct-tool",
        description: "Used the Bash tool",
        check: (output) => {
          const tool = (output.tool_used ?? "").toLowerCase().trim();
          return tool === "bash";
        },
      },
      {
        id: "correct-output",
        description: "Output is 11 (10 chars + newline)",
        check: (output) => {
          const val = (output.command_output ?? "").trim();
          return val === "11";
        },
      },
    ],
  },
  {
    id: "multi-step",
    title: "Multi-Step Handoff",
    description:
      "Read a value from one file, transform it, write to another. Tests tool chaining.",
    prompt: `1. Read /tmp/agentscore-test.txt
2. Count the number of words in the content
3. Write the word count (just the number) to /tmp/agentscore-wordcount.txt

Report all tools used in order and the word count.`,
    outputTemplate: JSON.stringify(
      {
        tools_used: "<comma-separated list of tools in order>",
        word_count: "<the number you wrote>",
        output_path: "</tmp/agentscore-wordcount.txt or other>",
      },
      null,
      2
    ),
    rubric: [
      {
        id: "used-read",
        description: "Used Read tool as first step",
        check: (output) => {
          const tools = (output.tools_used ?? "").toLowerCase();
          return tools.includes("read");
        },
      },
      {
        id: "used-write",
        description: "Used Write tool for output",
        check: (output) => {
          const tools = (output.tools_used ?? "").toLowerCase();
          return tools.includes("write");
        },
      },
      {
        id: "correct-count",
        description: "Word count is 5",
        check: (output) => (output.word_count ?? "").trim() === "5",
      },
      {
        id: "correct-path",
        description: "Output written to /tmp/agentscore-wordcount.txt",
        check: (output) =>
          (output.output_path ?? "").trim() ===
          "/tmp/agentscore-wordcount.txt",
      },
    ],
  },
  {
    id: "error-handling",
    title: "Error Handling",
    description:
      "Read a file that does not exist. Tests graceful error handling without hallucination.",
    prompt: `Read the file /tmp/agentscore-nonexistent-file-xyz.txt

This file does not exist. Report what happened.`,
    outputTemplate: JSON.stringify(
      {
        tool_used: "<Read or other>",
        error_occurred: "<yes or no>",
        hallucinated_content: "<yes or no — did you make up file content?>",
      },
      null,
      2
    ),
    rubric: [
      {
        id: "correct-tool",
        description: "Used the Read tool to attempt reading",
        check: (output) => {
          const tool = (output.tool_used ?? "").toLowerCase().trim();
          return tool === "read";
        },
      },
      {
        id: "reported-error",
        description: "Correctly reported that an error occurred",
        check: (output) =>
          (output.error_occurred ?? "").toLowerCase().trim() === "yes",
      },
      {
        id: "no-hallucination",
        description: "Did not hallucinate file content",
        check: (output) =>
          (output.hallucinated_content ?? "").toLowerCase().trim() === "no",
      },
    ],
  },
  {
    id: "git-task",
    title: "Git Status",
    description:
      "Run git status and report the output. Tests Bash usage for git operations.",
    prompt: `Run "git status" in your current working directory and report the output. Include the branch name and whether there are uncommitted changes.`,
    outputTemplate: JSON.stringify(
      {
        tool_used: "<Bash or other>",
        branch_name: "<current branch name>",
        has_uncommitted_changes: "<yes or no>",
      },
      null,
      2
    ),
    rubric: [
      {
        id: "correct-tool",
        description: "Used the Bash tool",
        check: (output) => {
          const tool = (output.tool_used ?? "").toLowerCase().trim();
          return tool === "bash";
        },
      },
      {
        id: "has-branch",
        description: "Reported a branch name (non-empty)",
        check: (output) => (output.branch_name ?? "").trim().length > 0,
      },
      {
        id: "has-status",
        description: "Reported uncommitted changes status",
        check: (output) => {
          const val = (output.has_uncommitted_changes ?? "").toLowerCase().trim();
          return val === "yes" || val === "no";
        },
      },
    ],
  },
];
