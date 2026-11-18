import type { PaperAnalysis } from "./types";

export const samplePaper: PaperAnalysis = {
  title: "Demo: Latent Planning with a Learned World Model",
  domain: "Model-based reinforcement learning · demonstration paper",
  oneLineContribution:
    "A fictional practice paper used to demonstrate the feedback workflow before uploading a PDF.",
  exercises: [
    {
      id: "demo-architecture",
      type: "architecture",
      title: "Trace the decision pathway",
      prompt:
        "Explain how information moves from an observation to an executed action. Separate learned representations, imagined rollouts, and the final control decision, then identify where model error could influence the action.",
      instructions:
        "Write 120–180 words. Describe data flow before discussing why each module may be useful.",
      difficulty: "intermediate",
      estimatedMinutes: 12,
      source: {
        page: 4,
        label: "Figure 2 · System architecture",
        excerpt:
          "The encoder maps observations to latent states. A dynamics model predicts candidate trajectories, which a planner scores before the policy executes the selected action.",
        visualDescription:
          "Observation → encoder → latent state → imagined rollouts → planner. A policy receives the selected latent trajectory and emits an action; environment feedback returns a new observation.",
        evidenceVisibility: "visible",
      },
      evaluationGuide: {
        requiredPoints: [
          "Distinguishes observation encoding from dynamics prediction",
          "Explains that planning evaluates imagined trajectories before action selection",
          "Identifies at least one path by which model error affects control",
        ],
        unsupportedClaims: [
          "The architecture guarantees robust real-world performance",
          "The policy corrects every dynamics-model error",
        ],
        commonTraps: [
          "Listing modules without describing their interfaces",
          "Treating imagined trajectories as real environment transitions",
        ],
        criteria: ["Architectural accuracy", "Mechanistic reasoning", "Causal restraint"],
      },
    },
    {
      id: "demo-results",
      type: "figure",
      title: "Interpret an ablation, not just a ranking",
      prompt:
        "Write a results interpretation that distinguishes the observed performance pattern from a mechanistic explanation. State what the ablation supports and what it cannot establish.",
      instructions: "Write one compact paragraph of 100–150 words.",
      difficulty: "advanced",
      estimatedMinutes: 10,
      source: {
        page: 7,
        label: "Figure 4 · Component ablation",
        excerpt:
          "Removing latent planning reduces mean success from 74% to 61%. Removing reconstruction regularization yields 70%. Error bars overlap for the full model and the no-regularization variant, but not for the no-planning variant.",
        visualDescription:
          "Three bars report task success: full model 74%, no planning 61%, and no reconstruction regularization 70%, each with uncertainty intervals.",
        evidenceVisibility: "visible",
      },
      evaluationGuide: {
        requiredPoints: [
          "Reports the larger decrease associated with removing planning",
          "Uses the uncertainty information when comparing variants",
          "Separates component importance from a proven causal mechanism",
        ],
        unsupportedClaims: [
          "Reconstruction regularization has no effect",
          "Planning is the sole cause of improved performance",
        ],
        commonTraps: ["Ignoring error bars", "Equating a single ablation with a full mechanism test"],
        criteria: ["Quantitative accuracy", "Evidence alignment", "Scope control"],
      },
    },
    {
      id: "demo-reviewer",
      type: "reviewer",
      title: "Design the missing stress test",
      prompt:
        "The method is evaluated only under the training distribution. Identify the most consequential unsupported generalization claim and design one controlled experiment that would test it.",
      instructions:
        "Specify the changed factor, held-constant factors, comparison, measurement, and possible outcomes. Do not propose a broad benchmark sweep.",
      difficulty: "advanced",
      estimatedMinutes: 15,
      source: {
        page: 9,
        label: "Section 5 · Limitations",
        excerpt:
          "All environments use the same object categories and sensor-noise range as training. The discussion suggests that latent planning should remain effective under visual and dynamics shifts.",
        visualDescription: "No visual is required for this reviewer exercise.",
        evidenceVisibility: "visible",
      },
      evaluationGuide: {
        requiredPoints: [
          "Selects one specific distribution shift",
          "Holds non-target factors constant",
          "Includes a baseline or comparison that isolates the claimed capability",
          "Defines an outcome that could weaken the generalization claim",
        ],
        unsupportedClaims: ["A single stress test establishes universal robustness"],
        commonTraps: ["Changing several factors simultaneously", "Proposing an unfalsifiable test"],
        criteria: ["Experimental isolation", "Falsifiability", "Claim alignment"],
      },
    },
  ],
};
