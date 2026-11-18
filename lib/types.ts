export type ExerciseType =
  | "architecture"
  | "figure"
  | "table"
  | "evidence_writing"
  | "reviewer"
  | "closed_book";

export type Difficulty = "foundation" | "intermediate" | "advanced";

export interface SourceAnchor {
  page: number;
  label: string;
  excerpt: string;
  visualDescription: string;
  evidenceVisibility: "visible" | "hidden";
}

export interface EvaluationGuide {
  requiredPoints: string[];
  unsupportedClaims: string[];
  commonTraps: string[];
  criteria: string[];
}

export interface Exercise {
  id: string;
  type: ExerciseType;
  title: string;
  prompt: string;
  instructions: string;
  difficulty: Difficulty;
  estimatedMinutes: number;
  source: SourceAnchor;
  evaluationGuide: EvaluationGuide;
}

export interface PaperAnalysis {
  title: string;
  domain: string;
  oneLineContribution: string;
  exercises: Exercise[];
}

export type FeedbackSeverity = "note" | "important" | "critical";

export interface FeedbackIssue {
  category:
    | "evidence"
    | "logic"
    | "accuracy"
    | "scope"
    | "structure"
    | "clarity";
  severity: FeedbackSeverity;
  passage: string;
  diagnosis: string;
  question: string;
}

export interface RubricScore {
  criterion: string;
  rating: "not_yet" | "developing" | "strong";
  evidence: string;
}

export interface ExerciseFeedback {
  overallSummary: string;
  strengths: string[];
  issues: FeedbackIssue[];
  rubricScores: RubricScore[];
  revisionPriority: string;
  revisionQuestions: string[];
}

export interface AttemptRecord {
  exerciseId: string;
  answer: string;
  submittedAt: string;
  feedback: ExerciseFeedback;
}
