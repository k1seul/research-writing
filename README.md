# Proofline

Proofline is a single-user, English-only practice environment for research reasoning and writing.
It turns AI research PDFs into source-grounded exercises and gives diagnostic feedback without
writing or rewriting the user's answer.

The current alpha supports:

- PDF-to-exercise generation through the OpenAI Responses API
- visual PDF input for figures, tables, and architecture diagrams
- architecture, figure, table, evidence-writing, reviewer, and closed-book exercises
- structured, feedback-only critique with explicit anti-ghostwriting constraints
- revision history and recurring-issue tracking in browser storage
- responsive desktop and mobile layouts
- an offline demonstration paper and illustrative feedback flow

## Run locally

Requirements: Node.js 20.9 or later and an OpenAI API key.

```bash
npm install
cp .env.example .env.local
# Add OPENAI_API_KEY to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app defaults to `gpt-6.2-astra`. Set `OPENAI_MODEL` in `.env.local` to another
vision-capable Responses API model with Structured Outputs support.

## Verification

```bash
npm run typecheck
npm run lint
npm run build
```

## How PDF generation works

1. The server validates and temporarily uploads the PDF with purpose `user_data`.
2. The Responses API receives the PDF at high visual detail, so both extracted text and page images
   are available to the model.
3. Structured Outputs constrain the result to a private evaluation guide plus user-facing prompts
   and source anchors.
4. The temporary remote file is deleted after generation, including when generation fails.
5. Feedback calls receive the selected exercise, its private atomic checks, and the user's response.
   The prompt and response schema contain no field for a rewritten answer.

The alpha stores generated sets and attempts in browser `localStorage`. This is convenient for one
device but does not yet synchronize between phone and laptop. Durable database storage and simple
single-user authentication are the next infrastructure milestone.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | Yes for live generation | Server-side API credential |
| `OPENAI_MODEL` | No | Responses API model override |
| `OPENAI_API_BASE` | No | OpenAI-compatible API base override |

Never expose the API key through a variable prefixed with `NEXT_PUBLIC_`.

## Product guardrail

Proofline may identify a weak claim, explain why it is weak, point to relevant evidence, score a
rubric, and ask a revision question. It must not produce a replacement sentence, sample paragraph,
completed argument, or model answer. This boundary is enforced in both prompts and the structured
feedback contract.

## Near-term roadmap

- persistent paper library and cross-device sync
- single-user authentication and encrypted provider settings
- page-region crops for precise figure and table practice
- Anthropic provider adapter
- evaluation set for hallucinated source anchors and figure-reading errors
- spaced repetition based on recurring reasoning weaknesses
