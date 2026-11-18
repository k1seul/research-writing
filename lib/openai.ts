const DEFAULT_API_BASE = "https://api.openai.com/v1";
const DEFAULT_MODEL = "gpt-6.2-astra";

interface StructuredResponseOptions {
  name: string;
  schema: Record<string, unknown>;
  prompt: string;
  instructions: string;
  fileId?: string;
}

function getConfig() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured. Add it to .env.local before generating exercises.",
    );
  }

  return {
    apiKey,
    apiBase: (process.env.OPENAI_API_BASE ?? DEFAULT_API_BASE).replace(/\/$/, ""),
    model: process.env.OPENAI_MODEL ?? DEFAULT_MODEL,
  };
}

async function openAIRequest(path: string, init: RequestInit) {
  const { apiKey, apiBase } = getConfig();
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...init.headers,
    },
    signal: AbortSignal.timeout(240_000),
  });

  if (!response.ok) {
    const body = await response.text();
    let detail = body;
    try {
      const parsed = JSON.parse(body) as { error?: { message?: string } };
      detail = parsed.error?.message ?? body;
    } catch {
      // Preserve non-JSON API errors.
    }
    throw new Error(`OpenAI request failed (${response.status}): ${detail}`);
  }

  return response;
}

export async function uploadPdf(file: File) {
  const form = new FormData();
  form.set("purpose", "user_data");
  form.set("file", file, file.name);

  const response = await openAIRequest("/files", {
    method: "POST",
    body: form,
  });
  const payload = (await response.json()) as { id?: string };
  if (!payload.id) throw new Error("The file upload completed without a file ID.");
  return payload.id;
}

export async function deleteRemoteFile(fileId: string) {
  try {
    await openAIRequest(`/files/${encodeURIComponent(fileId)}`, { method: "DELETE" });
  } catch (error) {
    console.warn("Could not delete temporary OpenAI file", error);
  }
}

function extractOutputText(payload: {
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
}) {
  if (payload.output_text) return payload.output_text;

  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && content.text) return content.text;
    }
  }

  throw new Error("The model returned no structured text output.");
}

export async function createStructuredResponse<T>({
  name,
  schema,
  prompt,
  instructions,
  fileId,
}: StructuredResponseOptions): Promise<T> {
  const { model } = getConfig();
  const content: Array<Record<string, string>> = [];

  if (fileId) {
    content.push({ type: "input_file", file_id: fileId, detail: "high" });
  }
  content.push({ type: "input_text", text: prompt });

  const response = await openAIRequest("/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      store: false,
      instructions,
      input: [{ role: "user", content }],
      text: {
        format: {
          type: "json_schema",
          name,
          strict: true,
          schema,
        },
      },
    }),
  });

  const payload = (await response.json()) as {
    output_text?: string;
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  };
  const text = extractOutputText(payload);

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("The model output did not contain valid JSON.");
  }
}
