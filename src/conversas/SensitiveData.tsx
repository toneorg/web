"use client";
// "Dados sensíveis" on the profile (toneorg/web#29): skin tone and personal coloring can reveal
// racial or ethnic origin (LGPD, art. 5º, II), so the tone keeps them only with the person's
// specific consent. This section shows when that consent stands: what was saved, what for, and how
// to take it back.
import { type Consent, type Memory, memoryLabel, SENSITIVE_CONSENT } from "@/tone/shared";
import { ApiError } from "./api";
import { dangerButton } from "./ui";

export const SENSITIVE_PURPOSE = "beleza_tom" as const;

/** The consent for the makeup purpose, when it stands. */
export const standingConsent = (consents: Consent[]) =>
  consents.find((consent) => consent.purpose === SENSITIVE_PURPOSE && consent.revokedAt === null);

/** What the profile says when the server will not save a sensitive note without the permission. */
export function consentRefusal(failure: unknown): string | null {
  if (!(failure instanceof ApiError) || !failure.consent) return null;
  return `Não guardei. ${failure.consent.text} Conte na conversa e eu peço sua permissão.`;
}

/** Shown with the consent standing, or when sensitive notes exist without it (saved before the consent); otherwise nothing. */
export function SensitiveDataView(props: {
  consents: Consent[];
  /** The sensitive notes, already filtered. */
  memories: Memory[];
  onRevoke: () => void;
}) {
  const consent = standingConsent(props.consents);
  if (!consent && props.memories.length === 0) return null;
  return (
    <section aria-labelledby="titulo-sensiveis" className="flex flex-col gap-3">
      <h3 id="titulo-sensiveis" className="text-subheading text-ink">
        Dados sensíveis
      </h3>
      {consent ? (
        <p className="text-small text-graphite">
          Tom de pele e coloração são dados sensíveis. Guardo com a sua permissão, só para:{" "}
          {SENSITIVE_CONSENT[SENSITIVE_PURPOSE].purpose.toLowerCase()}.
        </p>
      ) : (
        <p className="text-small text-graphite">
          Guardei isto antes de pedir a sua permissão. Sem ela, eu não uso: você pode apagar.
        </p>
      )}
      {props.memories.length === 0 ? (
        <p className="text-small text-graphite">Nada guardado por enquanto.</p>
      ) : (
        <ul className="flex flex-col gap-1" data-ph-mask>
          {props.memories.map((memory) => (
            <li key={memory.id} className="text-small text-ink">
              {memoryLabel(memory.key, memory.condition)}: {memory.value}
            </li>
          ))}
        </ul>
      )}
      <div>
        <button type="button" className={dangerButton} onClick={props.onRevoke}>
          {consent ? "Apagar e retirar permissão" : "Apagar"}
        </button>
      </div>
    </section>
  );
}
