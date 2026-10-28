// T06: every call of the conversation pages to the tone API goes through here (see src/lib/tone-bff.ts).
import { SeverityNumber } from "@opentelemetry/api-logs";
import { after } from "next/server";
import { posthogLog, posthogLogProvider } from "@/instrumentation";
import { proxyToTone } from "@/lib/tone-bff";

type Context = { params: Promise<{ path: string[] }> };

async function handle(request: Request, context: Context) {
  const apiUrl = process.env.TONE_API_URL;
  if (!apiUrl) return Response.json({ error: "A tone ainda não está ligada a esta web." }, { status: 503 });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

  const logProvider = posthogLogProvider;
  if (logProvider) {
    after(async () => {
      await logProvider.forceFlush();
    });
  }

  const response = await proxyToTone(request, (await context.params).path, { apiUrl, siteUrl });

  posthogLog?.emit({
    body: "tone_api_proxy_completed",
    severityNumber: response.ok ? SeverityNumber.INFO : SeverityNumber.WARN,
    attributes: { method: request.method, status_code: response.status },
  });

  return response;
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
export const dynamic = "force-dynamic";
