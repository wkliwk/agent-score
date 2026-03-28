import type { BenchmarkResult, TaskResult, CheckResult } from "./types";
import { BENCHMARK_TASKS } from "./tasks";

/**
 * Grade a set of benchmark task outputs against the rubric.
 * Each task output is a key-value record parsed from the user's JSON submission.
 */
export function gradeBenchmark(
  username: string,
  submissions: Record<string, Record<string, string>>
): BenchmarkResult {
  const tasks: TaskResult[] = BENCHMARK_TASKS.map((task) => {
    const output = submissions[task.id] ?? {};
    const checks: CheckResult[] = task.rubric.map((rubricCheck) => {
      let passed = false;
      let reason: string | undefined;
      try {
        passed = rubricCheck.check(output);
        if (!passed) {
          reason = `Expected check "${rubricCheck.description}" to pass`;
        }
      } catch {
        passed = false;
        reason = "Check threw an error during evaluation";
      }
      return {
        checkId: rubricCheck.id,
        description: rubricCheck.description,
        passed,
        reason: passed ? undefined : reason,
      };
    });

    return {
      taskId: task.id,
      passed: checks.every((c) => c.passed),
      checks,
    };
  });

  const passedTasks = tasks.filter((t) => t.passed).length;
  const totalTasks = tasks.length;
  const score = totalTasks > 0 ? Math.round((passedTasks / totalTasks) * 100) : 0;

  return {
    id: crypto.randomUUID(),
    username,
    score,
    totalTasks,
    passedTasks,
    tasks,
    submittedAt: new Date().toISOString(),
  };
}
