import { feedbackSchema } from "@/lib/contracts";
import { createStructuredResponse } from "@/lib/openai";
import { buildFeedbackPrompt } from "@/lib/prompts";
import type { Exercise, ExerciseFeedback } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 180;

interface RawFeedback {
  overall_summary: string;
  strengths: string[];
  issues: Array<{
    category: ExerciseFeedback["issues"][number]["category"];
    severity: ExerciseFeedback["issues"][number]["severity"];
    passage: string;
    diagnosis: string;
    question: string;
  }>;
  rubric_scores: Array<{
    criterion: string;
    rating: ExerciseFeedback["rubricScores"][number]["rating"];
    evidence: string;
  }>;
  revision_priority: string;
  revision_questions: string[];
}

function isExercise(value: unknown): value is Exercise {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Exercise>;
  return Boolean(
    candidate.id &&
      candidate.prompt &&
      candidate.source &&
      candidate.evaluationGuide &&
      Array.isArray(candidate.evaluationGuide.criteria),
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { exercise?: unknown; answer?: unknown };
    if (!isExercise(body.exercise)) {
      return Response.json({ error: "A valid exercise is required." }, { status: 400 });
    }
    if (typeof body.answer !== "string" || body.answer.trim().length < 20) {
      return Response.json(
        { error: "Write at least 20 characters before requesting feedback." },
        { status: 400 },
      );
    }
    if (body.answer.length > 12_000) {
      return Response.json({ error: "Responses are limited to 12,000 characters." }, { status: 413 });
    }

    const raw = await createStructuredResponse<RawFeedback>({
      name: "research_writing_feedback",
      schema: feedbackSchema as unknown as Record<string, unknown>,
      instructions:
        "Follow the feedback-only policy in the user prompt. Return structured diagnostic feedback only.",
      prompt: buildFeedbackPrompt(body.exercise, body.answer.trim()),
    });

    const feedback: ExerciseFeedback = {
      overallSummary: raw.overall_summary,
      strengths: raw.strengths,
      issues: raw.issues,
      rubricScores: raw.rubric_scores,
      revisionPriority: raw.revision_priority,
      revisionQuestions: raw.revision_questions,
    };

    return Response.json({ feedback });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Feedback generation failed.";
    console.error("Feedback generation failed", error);
    return Response.json({ error: message }, { status: 500 });
  }
}
