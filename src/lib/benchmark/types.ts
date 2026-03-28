export interface BenchmarkTask {
  id: string;
  title: string;
  description: string;
  prompt: string;
  outputTemplate: string;
  rubric: RubricCheck[];
}

export interface RubricCheck {
  id: string;
  description: string;
  check: (output: Record<string, string>) => boolean;
}

export interface TaskResult {
  taskId: string;
  passed: boolean;
  checks: CheckResult[];
}

export interface CheckResult {
  checkId: string;
  description: string;
  passed: boolean;
  reason?: string;
}

export interface BenchmarkResult {
  id: string;
  username: string;
  score: number;
  totalTasks: number;
  passedTasks: number;
  tasks: TaskResult[];
  submittedAt: string;
}
