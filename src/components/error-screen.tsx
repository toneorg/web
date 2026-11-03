"use client";
// What the person sees when a page crashes: one sentence, a way back and the
// feedback button, while the error goes to PostHog error tracking.
import Link from "next/link";
import posthog from "posthog-js";
import { useEffect } from "react";

export function ErrorScreen(props: { error: Error & { digest?: string }; retry: () => void; where: string }) {
  const { error, where } = props;
  useEffect(() => {
    posthog.captureException(error, { boundary: where, digest: error.digest });
  }, [error, where]);
  return (
    <main id="conteudo" className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 bg-paper px-5 py-12 text-ink">
      <h1 className="display-sm font-display">Algo deu errado aqui.</h1>
      <p className="text-body text-graphite">
        O erro já chegou até a equipe. Tente de novo; se continuar, conte o que estava fazendo pelo botão de feedback.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => props.retry()}
          className="press min-h-11 rounded-full bg-ink px-5 text-ui text-on-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Tentar de novo
        </button>
        <Link
          href="/conversas"
          className="press inline-flex min-h-11 items-center rounded-full bg-surface px-5 text-ui text-ink shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Voltar para as conversas
        </Link>
      </div>
    </main>
  );
}
