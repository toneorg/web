// T06: every call of the conversation pages to the tone API goes through here (see src/lib/tone-bff.ts).
import { proxyToTone } from "@/lib/tone-bff";

type Context = { params: Promise<{ path: string[] }> };

async function handle(request: Request, context: Context) {
  const apiUrl = process.env.TONE_API_URL;
  if (!apiUrl) return Response.json({ error: "A tone ainda não está ligada a esta web." }, { status: 503 });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  return proxyToTone(request, (await context.params).path, { apiUrl, siteUrl });
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
export const dynamic = "force-dynamic";
