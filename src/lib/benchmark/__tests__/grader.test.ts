import { describe, it, expect } from "vitest";
import { gradeBenchmark } from "../grader";
import { BENCHMARK_TASKS } from "../tasks";

describe("gradeBenchmark", () => {
  it("returns all tasks with fail when no submissions provided", () => {
    const result = gradeBenchmark("testuser", {});
    expect(result.username).toBe("testuser");
    expect(result.totalTasks).toBe(BENCHMARK_TASKS.length);
    expect(result.passedTasks).toBe(0);
    expect(result.score).toBe(0);
    expect(result.tasks).toHaveLength(BENCHMARK_TASKS.length);
    for (const task of result.tasks) {
      expect(task.passed).toBe(false);
    }
  });

  it("passes file-creation task with correct output", () => {
    const result = gradeBenchmark("testuser", {
      "file-creation": {
        tool_used: "Write",
        file_path: "/tmp/agentscore-test.txt",
        file_content: "Hello from AgentScore benchmark",
      },
    });
    const task = result.tasks.find((t) => t.taskId === "file-creation");
    expect(task?.passed).toBe(true);
    expect(task?.checks.every((c) => c.passed)).toBe(true);
  });

  it("fails file-creation task when wrong tool used", () => {
    const result = gradeBenchmark("testuser", {
      "file-creation": {
        tool_used: "Bash",
        file_path: "/tmp/agentscore-test.txt",
        file_content: "Hello from AgentScore benchmark",
      },
    });
    const task = result.tasks.find((t) => t.taskId === "file-creation");
    expect(task?.passed).toBe(false);
    const toolCheck = task?.checks.find((c) => c.checkId === "correct-tool");
    expect(toolCheck?.passed).toBe(false);
  });

  it("passes file-read task with correct output", () => {
    const result = gradeBenchmark("testuser", {
      "file-read": {
        tool_used: "Read",
        file_content: "Hello from AgentScore benchmark",
      },
    });
    const task = result.tasks.find((t) => t.taskId === "file-read");
    expect(task?.passed).toBe(true);
  });

  it("passes bash-execution task with correct output", () => {
    const result = gradeBenchmark("testuser", {
      "bash-execution": {
        tool_used: "Bash",
        command_output: "11",
      },
    });
    const task = result.tasks.find((t) => t.taskId === "bash-execution");
    expect(task?.passed).toBe(true);
  });

  it("passes multi-step task with correct output", () => {
    const result = gradeBenchmark("testuser", {
      "multi-step": {
        tools_used: "Read, Write",
        word_count: "5",
        output_path: "/tmp/agentscore-wordcount.txt",
      },
    });
    const task = result.tasks.find((t) => t.taskId === "multi-step");
    expect(task?.passed).toBe(true);
  });

  it("passes error-handling task with correct output", () => {
    const result = gradeBenchmark("testuser", {
      "error-handling": {
        tool_used: "Read",
        error_occurred: "yes",
        hallucinated_content: "no",
      },
    });
    const task = result.tasks.find((t) => t.taskId === "error-handling");
    expect(task?.passed).toBe(true);
  });

  it("passes git-task with correct output", () => {
    const result = gradeBenchmark("testuser", {
      "git-task": {
        tool_used: "Bash",
        branch_name: "main",
        has_uncommitted_changes: "no",
      },
    });
    const task = result.tasks.find((t) => t.taskId === "git-task");
    expect(task?.passed).toBe(true);
  });

  it("calculates correct score when all tasks pass", () => {
    const result = gradeBenchmark("testuser", {
      "file-creation": {
        tool_used: "Write",
        file_path: "/tmp/agentscore-test.txt",
        file_content: "Hello from AgentScore benchmark",
      },
      "file-read": {
        tool_used: "Read",
        file_content: "Hello from AgentScore benchmark",
      },
      "bash-execution": {
        tool_used: "Bash",
        command_output: "11",
      },
      "multi-step": {
        tools_used: "Read, Write",
        word_count: "5",
        output_path: "/tmp/agentscore-wordcount.txt",
      },
      "error-handling": {
        tool_used: "Read",
        error_occurred: "yes",
        hallucinated_content: "no",
      },
      "git-task": {
        tool_used: "Bash",
        branch_name: "main",
        has_uncommitted_changes: "no",
      },
    });
    expect(result.passedTasks).toBe(6);
    expect(result.score).toBe(100);
  });

  it("calculates partial score correctly", () => {
    const result = gradeBenchmark("testuser", {
      "file-creation": {
        tool_used: "Write",
        file_path: "/tmp/agentscore-test.txt",
        file_content: "Hello from AgentScore benchmark",
      },
      "file-read": {
        tool_used: "Read",
        file_content: "Hello from AgentScore benchmark",
      },
      "bash-execution": {
        tool_used: "Bash",
        command_output: "11",
      },
    });
    // 3 passed out of 6 total = 50%
    expect(result.passedTasks).toBe(3);
    expect(result.score).toBe(50);
  });

  it("generates valid id and timestamp", () => {
    const result = gradeBenchmark("testuser", {});
    expect(result.id).toBeTruthy();
    expect(result.submittedAt).toBeTruthy();
    expect(new Date(result.submittedAt).getTime()).not.toBeNaN();
  });

  it("is case-insensitive for tool names", () => {
    const result = gradeBenchmark("testuser", {
      "file-creation": {
        tool_used: "write",
        file_path: "/tmp/agentscore-test.txt",
        file_content: "Hello from AgentScore benchmark",
      },
    });
    const task = result.tasks.find((t) => t.taskId === "file-creation");
    expect(task?.passed).toBe(true);
  });
});
