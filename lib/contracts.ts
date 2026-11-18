export const paperAnalysisSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "domain", "one_line_contribution", "exercises"],
  properties: {
    title: { type: "string" },
    domain: { type: "string" },
    one_line_contribution: { type: "string" },
    exercises: {
      type: "array",
      minItems: 5,
      maxItems: 7,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "type",
          "title",
          "prompt",
          "instructions",
          "difficulty",
          "estimated_minutes",
          "source",
          "evaluation_guide",
        ],
        properties: {
          type: {
            type: "string",
            enum: [
              "architecture",
              "figure",
              "table",
              "evidence_writing",
              "reviewer",
              "closed_book",
            ],
          },
          title: { type: "string" },
          prompt: { type: "string" },
          instructions: { type: "string" },
          difficulty: {
            type: "string",
            enum: ["foundation", "intermediate", "advanced"],
          },
          estimated_minutes: { type: "integer", minimum: 3, maximum: 30 },
          source: {
            type: "object",
            additionalProperties: false,
            required: [
              "page",
              "label",
              "excerpt",
              "visual_description",
              "evidence_visibility",
            ],
            properties: {
              page: { type: "integer", minimum: 1 },
              label: { type: "string" },
              excerpt: { type: "string" },
              visual_description: { type: "string" },
              evidence_visibility: {
                type: "string",
                enum: ["visible", "hidden"],
              },
            },
          },
          evaluation_guide: {
            type: "object",
            additionalProperties: false,
            required: [
              "required_points",
              "unsupported_claims",
              "common_traps",
              "criteria",
            ],
            properties: {
              required_points: {
                type: "array",
                minItems: 2,
                items: { type: "string" },
              },
              unsupported_claims: {
                type: "array",
                items: { type: "string" },
              },
              common_traps: {
                type: "array",
                items: { type: "string" },
              },
              criteria: {
                type: "array",
                minItems: 2,
                items: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
} as const;

export const feedbackSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "overall_summary",
    "strengths",
    "issues",
    "rubric_scores",
    "revision_priority",
    "revision_questions",
  ],
  properties: {
    overall_summary: { type: "string" },
    strengths: { type: "array", maxItems: 4, items: { type: "string" } },
    issues: {
      type: "array",
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["category", "severity", "passage", "diagnosis", "question"],
        properties: {
          category: {
            type: "string",
            enum: ["evidence", "logic", "accuracy", "scope", "structure", "clarity"],
          },
          severity: {
            type: "string",
            enum: ["note", "important", "critical"],
          },
          passage: { type: "string" },
          diagnosis: { type: "string" },
          question: { type: "string" },
        },
      },
    },
    rubric_scores: {
      type: "array",
      minItems: 2,
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["criterion", "rating", "evidence"],
        properties: {
          criterion: { type: "string" },
          rating: {
            type: "string",
            enum: ["not_yet", "developing", "strong"],
          },
          evidence: { type: "string" },
        },
      },
    },
    revision_priority: { type: "string" },
    revision_questions: {
      type: "array",
      minItems: 1,
      maxItems: 4,
      items: { type: "string" },
    },
  },
} as const;
