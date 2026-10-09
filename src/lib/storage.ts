import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { Submission } from "./forms";

// Longer than the 10 s the documented Apps Script may wait for its lock, so a
// slow write is not reported as a failure and then retried into a duplicate.
const WEBHOOK_TIMEOUT_MS = 15_000;

/**
 * Persists a form submission.
 *
 * With SUBMISSIONS_WEBHOOK_URL set, the record is POSTed there as JSON (a
 * Google Apps Script bound to a Sheet, Zapier, Make or n8n all work; see
 * docs/google-sheets-webhook.md). Without it, records are appended to
 * data/submissions.jsonl. In production that needs SUBMISSIONS_ALLOW_DISK=1,
 * because most hosts give a server a disk that does not survive a deploy.
 */
export async function saveSubmission(submission: Submission) {
  const entry = { createdAt: new Date().toISOString(), ...submission };

  const webhook = process.env.SUBMISSIONS_WEBHOOK_URL;
  if (webhook) return postToWebhook(webhook, entry);

  if (process.env.NODE_ENV === "production" && process.env.SUBMISSIONS_ALLOW_DISK !== "1") {
    throw new Error(
      "SUBMISSIONS_WEBHOOK_URL is not set. Refusing to write submissions to a disk that may not persist.",
    );
  }
  await appendToFile(entry);
}

async function postToWebhook(url: string, entry: object) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(entry),
    signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
  // Apps Script answers a crashed doPost with an HTML error page and a 2xx
  // status, so a 2xx alone does not prove the row was written.
  if (res.headers.get("content-type")?.includes("text/html")) {
    throw new Error("Webhook answered with an HTML page instead of a confirmation");
  }
  // Read the reply to the end so the connection can be reused.
  await res.text();
}

async function appendToFile(entry: object) {
  const dir = path.join(process.cwd(), "data");
  await mkdir(dir, { recursive: true });
  await appendFile(path.join(dir, "submissions.jsonl"), `${JSON.stringify(entry)}\n`);
}
