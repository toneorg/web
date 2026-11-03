import { SeverityNumber } from "@opentelemetry/api-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchLogRecordProcessor, LoggerProvider } from "@opentelemetry/sdk-logs";
import type { Instrumentation } from "next";

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

// Server logs go to PostHog only when it is configured; without it the proxy works the same.
function configured() {
  return projectToken && host ? { projectToken, host } : null;
}

const configuration = configured();

export const posthogLogProvider = configuration
  ? new LoggerProvider({
      resource: resourceFromAttributes({ "service.name": "tone-web" }),
      processors: [
        new BatchLogRecordProcessor({
          exporter: new OTLPLogExporter({
            url: new URL("/i/v1/logs", configuration.host).toString(),
            headers: {
              Authorization: `Bearer ${configuration.projectToken}`,
              "Content-Type": "application/json",
            },
          }),
        }),
      ],
    })
  : null;

export const posthogLog = posthogLogProvider?.getLogger("tone-web-posthog");

export function register() {}

/**
 * Server errors (a page, a route handler or a server action that threw) go to PostHog error
 * tracking as `$exception`, under one server id: no person, no request body, no cookie.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (!configuration) return;
  const failure = error instanceof Error ? error : new Error(String(error));
  const digest = typeof error === "object" && error !== null && "digest" in error ? String(error.digest) : undefined;
  posthogLog?.emit({
    body: "next_request_error",
    severityNumber: SeverityNumber.ERROR,
    attributes: { route: context.routePath, route_type: context.routeType, method: request.method, digest },
  });
  try {
    await fetch(new URL("/i/v0/e/", configuration.host), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        api_key: configuration.projectToken,
        event: "$exception",
        distinct_id: "tone-web-server",
        properties: {
          $process_person_profile: false,
          $exception_list: [
            {
              type: failure.name,
              value: failure.message.slice(0, 1000),
              mechanism: { handled: false, synthetic: false },
              stacktrace: { type: "raw", frames: [] },
            },
          ],
          $exception_stack_trace_raw: failure.stack?.slice(0, 4000),
          surface: "web-server",
          route: context.routePath,
          route_type: context.routeType,
          render_source: context.renderSource,
          method: request.method,
          path: request.path.split("?")[0],
          digest,
        },
      }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // Reporting never turns one error into two.
  }
  await posthogLogProvider?.forceFlush().catch(() => undefined);
};
