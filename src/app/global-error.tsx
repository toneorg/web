"use client";
// The root layout itself failed: no fonts or styles can be trusted, so the page is plain.
import posthog from "posthog-js";
import { useEffect } from "react";

export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    posthog.captureException(error, { boundary: "global", digest: error.digest });
  }, [error]);

  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "3rem 1.25rem", maxWidth: "28rem", margin: "0 auto" }}>
        <h1>Algo deu errado.</h1>
        <p>O erro já chegou até a equipe da tone. Tente de novo em instantes.</p>
        <button type="button" onClick={() => retry()} style={{ minHeight: 44, padding: "0 1.25rem", borderRadius: 999 }}>
          Tentar de novo
        </button>
      </body>
    </html>
  );
}
