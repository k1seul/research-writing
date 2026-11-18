"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertIcon,
  ArrowIcon,
  BookIcon,
  ChartIcon,
  CheckIcon,
  CloseIcon,
  EyeIcon,
  FileIcon,
  MenuIcon,
  PenIcon,
  SparkIcon,
  UploadIcon,
} from "./icons";
import { samplePaper } from "@/lib/sample";
import type {
  AttemptRecord,
  Exercise,
  ExerciseFeedback,
  ExerciseType,
  PaperAnalysis,
} from "@/lib/types";

type View = "library" | "practice" | "progress";

const PAPER_STORAGE_KEY = "proofline.paper.v1";
const ATTEMPT_STORAGE_KEY = "proofline.attempts.v1";
const ANSWER_STORAGE_KEY = "proofline.answers.v1";

const typeLabels: Record<ExerciseType, string> = {
  architecture: "Architecture",
  figure: "Figure",
  table: "Table",
  evidence_writing: "Evidence writing",
  reviewer: "Reviewer mode",
  closed_book: "Closed-book",
};

const sampleFeedback: ExerciseFeedback = {
  overallSummary:
    "You identify the major stages, but the explanation needs a clearer boundary between what the diagram shows and why the design might work.",
  strengths: [
    "The response follows the observation-to-action direction rather than listing modules in isolation.",
    "You recognize that planning occurs over predicted rather than observed transitions.",
  ],
  issues: [
    {
      category: "logic",
      severity: "important",
      passage: "the planner fixes inaccurate predictions",
      diagnosis:
        "This assigns a corrective capability to the planner that is not established by the architecture description.",
      question:
        "What does the planner actually receive, and how would biased imagined trajectories constrain the options it can evaluate?",
    },
    {
      category: "scope",
      severity: "note",
      passage: "therefore the policy is robust",
      diagnosis:
        "A data-flow diagram alone cannot establish robustness under distribution shift.",
      question:
        "Which part of this sentence is an architectural observation, and which part would require an experiment?",
    },
  ],
  rubricScores: [
    {
      criterion: "Architectural accuracy",
      rating: "strong",
      evidence: "The main module order is represented correctly.",
    },
    {
      criterion: "Mechanistic reasoning",
      rating: "developing",
      evidence: "Interfaces are named, but the effect of prediction error is not traced through them.",
    },
    {
      criterion: "Causal restraint",
      rating: "not_yet",
      evidence: "The response infers robustness from structure without supporting evaluation evidence.",
    },
  ],
  revisionPriority:
    "Separate the observed computation path from the untested claim about how that path affects robustness.",
  revisionQuestions: [
    "Where can prediction error enter the pipeline?",
    "Which downstream module consumes that error without access to the true future?",
  ],
};

function readStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function NavButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className={`nav-button ${active ? "active" : ""}`} onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function Brand() {
  return (
    <div className="brand" aria-label="Proofline">
      <span className="brand-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span className="brand-name">Proofline</span>
      <span className="beta-pill">alpha</span>
    </div>
  );
}

export function ResearchWorkspace() {
  const [view, setView] = useState<View>("library");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [paper, setPaper] = useState<PaperAnalysis | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedbackByExercise, setFeedbackByExercise] = useState<
    Record<string, ExerciseFeedback>
  >({});
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [generating, setGenerating] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPaper(readStored<PaperAnalysis | null>(PAPER_STORAGE_KEY, null));
    setAttempts(readStored<AttemptRecord[]>(ATTEMPT_STORAGE_KEY, []));
    setAnswers(readStored<Record<string, string>>(ANSWER_STORAGE_KEY, {}));
  }, []);

  useEffect(() => {
    if (!file) {
      setPdfUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPdfUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  useEffect(() => {
    window.localStorage.setItem(ANSWER_STORAGE_KEY, JSON.stringify(answers));
  }, [answers]);

  const currentExercise = paper?.exercises[currentIndex] ?? null;
  const currentAnswer = currentExercise ? answers[currentExercise.id] ?? "" : "";
  const currentFeedback = currentExercise
    ? feedbackByExercise[currentExercise.id] ??
      attempts.findLast((attempt) => attempt.exerciseId === currentExercise.id)?.feedback
    : undefined;

  const completedIds = useMemo(
    () => new Set(attempts.map((attempt) => attempt.exerciseId)),
    [attempts],
  );

  function persistPaper(nextPaper: PaperAnalysis) {
    setPaper(nextPaper);
    window.localStorage.setItem(PAPER_STORAGE_KEY, JSON.stringify(nextPaper));
  }

  function chooseFile(nextFile: File | null) {
    setError(null);
    if (!nextFile) return;
    if (nextFile.type !== "application/pdf" && !nextFile.name.toLowerCase().endsWith(".pdf")) {
      setError("Choose a PDF paper.");
      return;
    }
    if (nextFile.size > 30 * 1024 * 1024) {
      setError("The PDF must be smaller than 30 MB.");
      return;
    }
    setFile(nextFile);
  }

  async function generateExercises() {
    if (!file) return;
    setGenerating(true);
    setError(null);

    try {
      const form = new FormData();
      form.set("paper", file);
      const response = await fetch("/api/exercises", { method: "POST", body: form });
      const payload = (await response.json()) as { paper?: PaperAnalysis; error?: string };
      if (!response.ok || !payload.paper) {
        throw new Error(payload.error ?? "The paper could not be analyzed.");
      }
      persistPaper(payload.paper);
      setCurrentIndex(0);
      setFeedbackByExercise({});
      setView("practice");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  function openSample() {
    persistPaper(samplePaper);
    setCurrentIndex(0);
    setFeedbackByExercise({});
    setView("practice");
  }

  function updateAnswer(value: string) {
    if (!currentExercise) return;
    setAnswers((previous) => ({ ...previous, [currentExercise.id]: value }));
  }

  async function requestFeedback() {
    if (!currentExercise || currentAnswer.trim().length < 20) {
      setError("Write at least 20 characters before requesting feedback.");
      return;
    }
    setReviewing(true);
    setError(null);

    try {
      let feedback: ExerciseFeedback;
      if (currentExercise.id.startsWith("demo-")) {
        await new Promise((resolve) => window.setTimeout(resolve, 650));
        feedback = sampleFeedback;
      } else {
        const response = await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ exercise: currentExercise, answer: currentAnswer }),
        });
        const payload = (await response.json()) as {
          feedback?: ExerciseFeedback;
          error?: string;
        };
        if (!response.ok || !payload.feedback) {
          throw new Error(payload.error ?? "Feedback could not be generated.");
        }
        feedback = payload.feedback;
      }

      setFeedbackByExercise((previous) => ({
        ...previous,
        [currentExercise.id]: feedback,
      }));
      const nextAttempt: AttemptRecord = {
        exerciseId: currentExercise.id,
        answer: currentAnswer.trim(),
        submittedAt: new Date().toISOString(),
        feedback,
      };
      const nextAttempts = [...attempts, nextAttempt];
      setAttempts(nextAttempts);
      window.localStorage.setItem(ATTEMPT_STORAGE_KEY, JSON.stringify(nextAttempts));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Feedback failed.");
    } finally {
      setReviewing(false);
    }
  }

  function selectExercise(index: number) {
    setCurrentIndex(index);
    setError(null);
  }

  const closeMobileNav = (nextView: View) => {
    setView(nextView);
    setMobileNavOpen(false);
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? "open" : ""}`}>
        <div className="sidebar-top">
          <Brand />
          <button
            className="icon-button sidebar-close"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation"
          >
            <CloseIcon />
          </button>
        </div>
        <nav className="main-nav" aria-label="Main navigation">
          <NavButton
            active={view === "library"}
            icon={<BookIcon />}
            label="Paper library"
            onClick={() => closeMobileNav("library")}
          />
          <NavButton
            active={view === "practice"}
            icon={<PenIcon />}
            label="Practice"
            onClick={() => closeMobileNav("practice")}
          />
          <NavButton
            active={view === "progress"}
            icon={<ChartIcon />}
            label="Progress"
            onClick={() => closeMobileNav("progress")}
          />
        </nav>
        <div className="sidebar-principle">
          <SparkIcon />
          <div>
            <span>Feedback, not ghostwriting</span>
            <p>Proofline diagnoses your reasoning and leaves every revision to you.</p>
          </div>
        </div>
        <div className="sidebar-footer">
          <span className="status-dot" />
          <span>Private single-user workspace</span>
        </div>
      </aside>

      {mobileNavOpen && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <main className="main-content">
        <header className="mobile-header">
          <button
            className="icon-button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation"
          >
            <MenuIcon />
          </button>
          <Brand />
          <span className="mobile-header-spacer" />
        </header>

        {view === "library" && (
          <LibraryView
            file={file}
            paper={paper}
            error={error}
            generating={generating}
            fileInputRef={fileInputRef}
            onChooseFile={chooseFile}
            onGenerate={generateExercises}
            onSample={openSample}
            onPractice={() => setView("practice")}
          />
        )}

        {view === "practice" &&
          (paper && currentExercise ? (
            <PracticeView
              paper={paper}
              exercise={currentExercise}
              exerciseIndex={currentIndex}
              pdfUrl={pdfUrl}
              answer={currentAnswer}
              feedback={currentFeedback}
              completedIds={completedIds}
              reviewing={reviewing}
              error={error}
              onSelectExercise={selectExercise}
              onAnswer={updateAnswer}
              onFeedback={requestFeedback}
            />
          ) : (
            <EmptyPractice onLibrary={() => setView("library")} onSample={openSample} />
          ))}

        {view === "progress" && <ProgressView attempts={attempts} paper={paper} />}
      </main>
    </div>
  );
}

function LibraryView({
  file,
  paper,
  error,
  generating,
  fileInputRef,
  onChooseFile,
  onGenerate,
  onSample,
  onPractice,
}: {
  file: File | null;
  paper: PaperAnalysis | null;
  error: string | null;
  generating: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onChooseFile: (file: File | null) => void;
  onGenerate: () => void;
  onSample: () => void;
  onPractice: () => void;
}) {
  const [dragging, setDragging] = useState(false);

  return (
    <div className="library-view page-frame">
      <section className="library-hero">
        <div className="eyebrow">Research reasoning practice</div>
        <h1>Read closely.<br />Write what the evidence earns.</h1>
        <p>
          Turn any AI paper into focused exercises for architecture reading, figure
          interpretation, evidence-grounded writing, and reviewer-level reasoning.
        </p>
        <div className="principle-row" aria-label="Product principles">
          <span><CheckIcon /> Source-grounded</span>
          <span><CheckIcon /> English-only practice</span>
          <span><CheckIcon /> No answer writing</span>
        </div>
      </section>

      <section className="upload-card">
        <div className="upload-card-heading">
          <div>
            <span className="step-label">Start a practice set</span>
            <h2>Upload one research paper</h2>
          </div>
          <span className="format-pill">PDF · 30 MB max</span>
        </div>

        <button
          className={`drop-zone ${dragging ? "dragging" : ""} ${file ? "has-file" : ""}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            onChooseFile(event.dataTransfer.files[0] ?? null);
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={(event) => onChooseFile(event.target.files?.[0] ?? null)}
            hidden
          />
          {file ? (
            <>
              <span className="upload-icon file-selected"><FileIcon /></span>
              <strong>{file.name}</strong>
              <span>{(file.size / 1024 / 1024).toFixed(1)} MB · ready to analyze</span>
            </>
          ) : (
            <>
              <span className="upload-icon"><UploadIcon /></span>
              <strong>Drop a paper here</strong>
              <span>or click to choose a PDF</span>
            </>
          )}
        </button>

        {error && <div className="inline-error"><AlertIcon />{error}</div>}

        <div className="upload-actions">
          <button className="primary-button" disabled={!file || generating} onClick={onGenerate}>
            {generating ? (
              <><span className="spinner" /> Reading text, figures, and diagrams…</>
            ) : (
              <>Generate practice set <ArrowIcon /></>
            )}
          </button>
          <button className="text-button" onClick={onSample}>
            Explore a sample session
          </button>
        </div>
      </section>

      {paper && (
        <section className="recent-paper">
          <div className="recent-paper-title">
            <span className="paper-monogram">P</span>
            <div>
              <span className="step-label">Current paper</span>
              <h3>{paper.title}</h3>
              <p>{paper.domain}</p>
            </div>
          </div>
          <div className="recent-paper-meta">
            <span>{paper.exercises.length} exercises</span>
            <button className="secondary-button" onClick={onPractice}>Continue practice <ArrowIcon /></button>
          </div>
        </section>
      )}

      <section className="mode-grid" aria-label="Practice modes">
        <ModeCard number="01" title="Architecture" text="Trace modules, interfaces, objectives, and train–inference boundaries." />
        <ModeCard number="02" title="Evidence" text="Match every claim to the exact result, caption, or methodological constraint." />
        <ModeCard number="03" title="Reviewer" text="Find missing controls, alternative explanations, and unsupported scope." />
      </section>
    </div>
  );
}

function ModeCard({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <article className="mode-card">
      <span>{number}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function EmptyPractice({ onLibrary, onSample }: { onLibrary: () => void; onSample: () => void }) {
  return (
    <div className="empty-state page-frame">
      <span className="empty-icon"><PenIcon /></span>
      <div className="eyebrow">No active paper</div>
      <h1>Your next revision starts with a source.</h1>
      <p>Upload a PDF to generate a grounded set, or open the demonstration paper.</p>
      <div className="empty-actions">
        <button className="primary-button" onClick={onLibrary}>Choose a paper</button>
        <button className="secondary-button" onClick={onSample}>Open sample</button>
      </div>
    </div>
  );
}

function PracticeView({
  paper,
  exercise,
  exerciseIndex,
  pdfUrl,
  answer,
  feedback,
  completedIds,
  reviewing,
  error,
  onSelectExercise,
  onAnswer,
  onFeedback,
}: {
  paper: PaperAnalysis;
  exercise: Exercise;
  exerciseIndex: number;
  pdfUrl: string | null;
  answer: string;
  feedback?: ExerciseFeedback;
  completedIds: Set<string>;
  reviewing: boolean;
  error: string | null;
  onSelectExercise: (index: number) => void;
  onAnswer: (answer: string) => void;
  onFeedback: () => void;
}) {
  const words = answer.trim() ? answer.trim().split(/\s+/).length : 0;

  return (
    <div className="practice-page">
      <header className="practice-header">
        <div className="paper-context">
          <span className="step-label">Active paper</span>
          <h1>{paper.title}</h1>
          <p>{paper.domain}</p>
        </div>
        <div className="session-progress">
          <span>{completedIds.size} of {paper.exercises.length} attempted</span>
          <div className="progress-track">
            <span style={{ width: `${Math.min(100, (completedIds.size / paper.exercises.length) * 100)}%` }} />
          </div>
        </div>
      </header>

      <div className="exercise-strip" role="tablist" aria-label="Exercises">
        {paper.exercises.map((item, index) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={index === exerciseIndex}
            className={`exercise-tab ${index === exerciseIndex ? "active" : ""}`}
            onClick={() => onSelectExercise(index)}
          >
            <span className="exercise-number">
              {completedIds.has(item.id) ? <CheckIcon /> : String(index + 1).padStart(2, "0")}
            </span>
            <span>
              <strong>{typeLabels[item.type]}</strong>
              <small>{item.estimatedMinutes} min</small>
            </span>
          </button>
        ))}
      </div>

      <section className="prompt-band">
        <div className="prompt-index">{String(exerciseIndex + 1).padStart(2, "0")}</div>
        <div className="prompt-copy">
          <div className="prompt-meta">
            <span className={`type-chip type-${exercise.type}`}>{typeLabels[exercise.type]}</span>
            <span>{exercise.difficulty}</span>
            <span>{exercise.estimatedMinutes} minutes</span>
          </div>
          <h2>{exercise.title}</h2>
          <p>{exercise.prompt}</p>
          <div className="instruction-line"><EyeIcon /> {exercise.instructions}</div>
        </div>
      </section>

      <div className="workbench">
        <SourcePanel exercise={exercise} pdfUrl={pdfUrl} />
        <WritingPanel
          answer={answer}
          words={words}
          feedback={feedback}
          reviewing={reviewing}
          error={error}
          onAnswer={onAnswer}
          onFeedback={onFeedback}
        />
      </div>
    </div>
  );
}

function SourcePanel({ exercise, pdfUrl }: { exercise: Exercise; pdfUrl: string | null }) {
  const hidden = exercise.source.evidenceVisibility === "hidden";
  return (
    <section className="source-panel panel">
      <div className="panel-header">
        <div>
          <span className="step-label">Source</span>
          <h3>{hidden ? "Closed-book prompt" : exercise.source.label}</h3>
        </div>
        {!hidden && <span className="page-pill">Page {exercise.source.page}</span>}
      </div>

      {hidden ? (
        <div className="closed-book-card">
          <span><EyeIcon /></span>
          <h4>Evidence intentionally withheld</h4>
          <p>
            Make assumptions explicit and mark claims that would require external evidence.
            You are being evaluated on reasoning, not factual recall.
          </p>
        </div>
      ) : pdfUrl ? (
        <div className="pdf-frame">
          <iframe
            title={`Paper source, page ${exercise.source.page}`}
            src={`${pdfUrl}#page=${exercise.source.page}&view=FitH`}
          />
        </div>
      ) : (
        <div className="source-proxy">
          <div className="source-proxy-topline">
            <span>Source preview</span>
            <span>{exercise.source.label}</span>
          </div>
          <div className="diagram-flow" aria-label="Visual description">
            {exercise.source.visualDescription
              .split(/(?:→|;)/)
              .slice(0, 5)
              .map((part, index, parts) => (
                <div className="diagram-step" key={`${part}-${index}`}>
                  <span>{part.trim().replace(/\.$/, "")}</span>
                  {index < parts.length - 1 && <ArrowIcon />}
                </div>
              ))}
          </div>
          <p className="visual-description">{exercise.source.visualDescription}</p>
        </div>
      )}

      {!hidden && (
        <div className="evidence-card">
          <span className="step-label">Grounding note</span>
          <p>{exercise.source.excerpt}</p>
        </div>
      )}
    </section>
  );
}

function WritingPanel({
  answer,
  words,
  feedback,
  reviewing,
  error,
  onAnswer,
  onFeedback,
}: {
  answer: string;
  words: number;
  feedback?: ExerciseFeedback;
  reviewing: boolean;
  error: string | null;
  onAnswer: (answer: string) => void;
  onFeedback: () => void;
}) {
  return (
    <section className="writing-panel panel">
      <div className="panel-header writing-header">
        <div>
          <span className="step-label">Your response</span>
          <h3>{feedback ? "Revise from diagnosis" : "Build the argument yourself"}</h3>
        </div>
        <span className="word-count">{words} words</span>
      </div>

      <textarea
        className="writing-area"
        value={answer}
        onChange={(event) => onAnswer(event.target.value)}
        placeholder="Start with what the source directly shows. Then separate your interpretation from claims that need more evidence…"
        aria-label="Your response"
      />

      <div className="editor-footer">
        <p><SparkIcon /> Feedback identifies gaps; it will not rewrite your answer.</p>
        <button
          className="primary-button compact"
          disabled={reviewing || answer.trim().length < 20}
          onClick={onFeedback}
        >
          {reviewing ? <><span className="spinner" /> Reviewing…</> : feedback ? "Review revision" : "Request feedback"}
        </button>
      </div>

      {error && <div className="inline-error editor-error"><AlertIcon />{error}</div>}
      {feedback && <FeedbackPanel feedback={feedback} />}
    </section>
  );
}

function FeedbackPanel({ feedback }: { feedback: ExerciseFeedback }) {
  return (
    <div className="feedback-panel">
      <div className="feedback-heading">
        <div>
          <span className="step-label">Diagnostic feedback</span>
          <h3>One revision at a time</h3>
        </div>
        <span className="feedback-only-pill">No rewrite</span>
      </div>

      <p className="feedback-summary">{feedback.overallSummary}</p>

      {feedback.strengths.length > 0 && (
        <div className="feedback-section strengths">
          <h4><CheckIcon /> What is working</h4>
          <ul>{feedback.strengths.map((strength) => <li key={strength}>{strength}</li>)}</ul>
        </div>
      )}

      {feedback.issues.length > 0 && (
        <div className="feedback-section">
          <h4><AlertIcon /> Reconsider these moves</h4>
          <div className="issue-list">
            {feedback.issues.map((issue, index) => (
              <article className={`issue-card severity-${issue.severity}`} key={`${issue.passage}-${index}`}>
                <div className="issue-meta">
                  <span>{issue.category}</span>
                  <span>{issue.severity}</span>
                </div>
                {issue.passage && <q>{issue.passage}</q>}
                <p>{issue.diagnosis}</p>
                <div className="coach-question"><strong>Ask yourself</strong>{issue.question}</div>
              </article>
            ))}
          </div>
        </div>
      )}

      <div className="rubric-grid">
        {feedback.rubricScores.map((score) => (
          <div className="rubric-item" key={score.criterion}>
            <span className={`rating-dot rating-${score.rating}`} />
            <div><strong>{score.criterion}</strong><p>{score.evidence}</p></div>
          </div>
        ))}
      </div>

      <div className="revision-card">
        <span className="step-label">Next revision priority</span>
        <p>{feedback.revisionPriority}</p>
        <ul>{feedback.revisionQuestions.map((question) => <li key={question}>{question}</li>)}</ul>
      </div>
    </div>
  );
}

function ProgressView({ attempts, paper }: { attempts: AttemptRecord[]; paper: PaperAnalysis | null }) {
  const latestByExercise = new Map<string, AttemptRecord>();
  for (const attempt of attempts) latestByExercise.set(attempt.exerciseId, attempt);
  const latest = [...latestByExercise.values()];
  const revisions = Math.max(0, attempts.length - latest.length);
  const ratings = latest.flatMap((attempt) => attempt.feedback.rubricScores);
  const strong = ratings.filter((rating) => rating.rating === "strong").length;
  const categories = latest
    .flatMap((attempt) => attempt.feedback.issues)
    .reduce<Record<string, number>>((counts, issue) => {
      counts[issue.category] = (counts[issue.category] ?? 0) + 1;
      return counts;
    }, {});
  const sortedCategories = Object.entries(categories).sort((a, b) => b[1] - a[1]);

  return (
    <div className="progress-view page-frame">
      <section className="progress-hero">
        <div className="eyebrow">Practice record</div>
        <h1>Track the reasoning habits<br />behind the prose.</h1>
        <p>Progress is stored in this browser for the current alpha.</p>
      </section>

      <section className="metric-grid">
        <Metric value={String(latest.length)} label="Exercises attempted" detail={paper?.title ?? "No active paper"} />
        <Metric value={String(revisions)} label="Revisions reviewed" detail="Repeated feedback requests" />
        <Metric
          value={ratings.length ? `${Math.round((strong / ratings.length) * 100)}%` : "—"}
          label="Strong rubric marks"
          detail={`${ratings.length} criteria assessed`}
        />
      </section>

      <section className="progress-detail-grid">
        <article className="progress-card">
          <div className="panel-header">
            <div><span className="step-label">Recurring issues</span><h3>Where to focus next</h3></div>
          </div>
          {sortedCategories.length ? (
            <div className="category-bars">
              {sortedCategories.map(([category, count]) => (
                <div className="category-row" key={category}>
                  <span>{category}</span>
                  <div className="category-track"><span style={{ width: `${Math.max(12, (count / sortedCategories[0][1]) * 100)}%` }} /></div>
                  <strong>{count}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-copy">Complete an exercise to reveal recurring reasoning patterns.</p>
          )}
        </article>

        <article className="progress-card">
          <div className="panel-header">
            <div><span className="step-label">Recent work</span><h3>Revision history</h3></div>
          </div>
          {attempts.length ? (
            <div className="history-list">
              {attempts.slice(-5).reverse().map((attempt, index) => (
                <div className="history-item" key={`${attempt.exerciseId}-${attempt.submittedAt}-${index}`}>
                  <span className="history-mark"><PenIcon /></span>
                  <div><strong>Feedback received</strong><p>{new Date(attempt.submittedAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</p></div>
                  <span>{attempt.answer.trim().split(/\s+/).length} words</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-copy">Your submitted drafts and revisions will appear here.</p>
          )}
        </article>
      </section>
    </div>
  );
}

function Metric({ value, label, detail }: { value: string; label: string; detail: string }) {
  return (
    <article className="metric-card">
      <strong>{value}</strong>
      <span>{label}</span>
      <p>{detail}</p>
    </article>
  );
}
