import { paperAnalysisSchema } from "@/lib/contracts";
import {
  createStructuredResponse,
  deleteRemoteFile,
  uploadPdf,
} from "@/lib/openai";
import { exerciseGenerationInstructions } from "@/lib/prompts";
import type { PaperAnalysis } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_FILE_BYTES = 30 * 1024 * 1024;

interface RawPaperAnalysis {
  title: string;
  domain: string;
  one_line_contribution: string;
  exercises: Array<{
    type: PaperAnalysis["exercises"][number]["type"];
    title: string;
    prompt: string;
    instructions: string;
    difficulty: PaperAnalysis["exercises"][number]["difficulty"];
    estimated_minutes: number;
    source: {
      page: number;
      label: string;
      excerpt: string;
      visual_description: string;
      evidence_visibility: "visible" | "hidden";
    };
    evaluation_guide: {
      required_points: string[];
      unsupported_claims: string[];
      common_traps: string[];
      criteria: string[];
    };
  }>;
}

function normalize(raw: RawPaperAnalysis): PaperAnalysis {
  return {
    title: raw.title,
    domain: raw.domain,
    oneLineContribution: raw.one_line_contribution,
    exercises: raw.exercises.map((exercise) => ({
      id: crypto.randomUUID(),
      type: exercise.type,
      title: exercise.title,
      prompt: exercise.prompt,
      instructions: exercise.instructions,
      difficulty: exercise.difficulty,
      estimatedMinutes: exercise.estimated_minutes,
      source: {
        page: exercise.source.page,
        label: exercise.source.label,
        excerpt: exercise.source.excerpt,
        visualDescription: exercise.source.visual_description,
        evidenceVisibility: exercise.source.evidence_visibility,
      },
      evaluationGuide: {
        requiredPoints: exercise.evaluation_guide.required_points,
        unsupportedClaims: exercise.evaluation_guide.unsupported_claims,
        commonTraps: exercise.evaluation_guide.common_traps,
        criteria: exercise.evaluation_guide.criteria,
      },
    })),
  };
}

export async function POST(request: Request) {
  let remoteFileId: string | undefined;

  try {
    const form = await request.formData();
    const file = form.get("paper");

    if (!(file instanceof File)) {
      return Response.json({ error: "Attach one PDF in the paper field." }, { status: 400 });
    }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return Response.json({ error: "Only PDF papers are supported." }, { status: 415 });
    }
    if (file.size === 0 || file.size > MAX_FILE_BYTES) {
      return Response.json(
        { error: "The PDF must be between 1 byte and 30 MB." },
        { status: 413 },
      );
    }

    remoteFileId = await uploadPdf(file);
    const raw = await createStructuredResponse<RawPaperAnalysis>({
      name: "paper_practice_set",
      schema: paperAnalysisSchema as unknown as Record<string, unknown>,
      instructions: exerciseGenerationInstructions,
      prompt:
        "Read this paper closely and generate the practice set. Return only the requested structured data.",
      fileId: remoteFileId,
    });

    return Response.json({ paper: normalize(raw) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Exercise generation failed.";
    console.error("Exercise generation failed", error);
    return Response.json({ error: message }, { status: 500 });
  } finally {
    if (remoteFileId) await deleteRemoteFile(remoteFileId);
  }
}
