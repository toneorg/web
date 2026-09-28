import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

export type SubmissionKind = "waitlist" | "brand";

/**
 * Persists a form submission.
 *
 * With SUBMISSIONS_WEBHOOK_URL set, the record is POSTed there as JSON (a
 * Google Apps Script bound to a Sheet, Zapier, Make or n8n all work; see
 * docs/google-sheets-webhook.md). Without it, records are appended to
 * data/submissions.jsonl, which only makes sense on a machine with a disk.
 */
export async function saveSubmission(
  kind: SubmissionKind,
  record: Record<string, unknown>,
) {
  const entry = { kind, createdAt: new Date().toISOString(), ...record };
  const webhook = process.env.SUBMISSIONS_WEBHOOK_URL;

  if (webhook) {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(entry),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
    return;
  }

  if (process.env.VERCEL) {
    throw new Error("SUBMISSIONS_WEBHOOK_URL is not set on this deployment");
  }

  const dir = path.join(process.cwd(), "data");
  await mkdir(dir, { recursive: true });
  await appendFile(
    path.join(dir, "submissions.jsonl"),
    `${JSON.stringify(entry)}\n`,
  );
}
