import { NextRequest, NextResponse } from "next/server";
import { gradeBenchmark } from "@/lib/benchmark/grader";
import { BENCHMARK_TASKS } from "@/lib/benchmark/tasks";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, submissions } = body as {
      username?: string;
      submissions?: Record<string, Record<string, string>>;
    };

    if (!username || typeof username !== "string" || username.trim().length === 0) {
      return NextResponse.json(
        { error: "username is required" },
        { status: 400 }
      );
    }

    if (!submissions || typeof submissions !== "object") {
      return NextResponse.json(
        { error: "submissions object is required" },
        { status: 400 }
      );
    }

    // Validate that submission keys are valid task IDs
    const validIds = new Set(BENCHMARK_TASKS.map((t) => t.id));
    const invalidKeys = Object.keys(submissions).filter((k) => !validIds.has(k));
    if (invalidKeys.length > 0) {
      return NextResponse.json(
        { error: `Unknown task IDs: ${invalidKeys.join(", ")}` },
        { status: 400 }
      );
    }

    const result = gradeBenchmark(username.trim(), submissions);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

export async function GET() {
  // Return task definitions (without rubric check functions)
  const tasks = BENCHMARK_TASKS.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    prompt: t.prompt,
    outputTemplate: t.outputTemplate,
    checkCount: t.rubric.length,
    checks: t.rubric.map((r) => ({ id: r.id, description: r.description })),
  }));

  return NextResponse.json({ tasks });
}
