import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchLogRecordProcessor, LoggerProvider } from "@opentelemetry/sdk-logs";

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
