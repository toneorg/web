"use client";
// The web app since 15/11/2026: one chat with the tone, like talking to someone in a messaging
// app. No list of conversations: the person's history is the chat itself, older messages above.
// The top bar opens the search (Buscar, Cmd/Ctrl+K) and the profile (the avatar); the panels stay
// on the left as they were.
import { useCallback, useEffect, useState } from "react";
import type { Me, MessageMatch } from "@/tone/shared";
import { track } from "./analytics";
import { ApiError, api, peek, prefetchChat } from "./api";
import { Conversation, type Outbox } from "./Conversation";
import { Onboarding, onboardingSeen } from "./Onboarding";
import { ProfileSheet } from "./Profile";
import { SearchDialog } from "./Search";
import { Shell } from "./Shell";
import { linkedReset, SignIn } from "./SignIn";
import { type ChatTarget, targetFromSearch } from "./timeline";
import { outlineButton } from "./ui";
import { dismissWelcome, WELCOME_MEMORY_FLOOR, welcomeDismissed } from "./welcome";

const primary =
  "press min-h-11 rounded-full bg-ink px-5 text-ui text-on-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const quiet = outlineButton;
const tone = "max-w-[min(88%,38rem)] rounded-panel rounded-es-tag bg-surface px-4 py-2.5 text-body text-ink shadow-raised";

/** The first name, for the greeting. */
const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? "";

/** What the tone says in a chat with nothing in it yet; with few memories, the welcome questions too. */
function FirstWords(props: { me: Me; offerWelcome: boolean; onWelcome: () => void; onDismiss: () => void }) {
  return (
    <div className="flex flex-col items-start gap-2">
      <p className={tone}>
        <span className="sr-only">tone: </span>
        Oi{firstName(props.me.name) ? `, ${firstName(props.me.name)}` : ""}! Me diz o que você procura e eu pesquiso nas lojas por
        você: trago poucas opções, com o porquê de cada uma.
      </p>
      {props.offerWelcome ? (
        <div className={`${tone} flex flex-col gap-3`}>
          <p>
            Quer que eu te conheça primeiro? São cinco perguntas rápidas, uma por vez: o que você costuma comprar, onde e quanto
            quer gastar. É opcional, e o que você responder fica no seu perfil.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={primary} onClick={props.onWelcome}>
              Responder agora
            </button>
            <button type="button" className={quiet} onClick={props.onDismiss}>
              Agora não
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function Chat() {
  const [me, setMe] = useState<Me | null>(() => peek<Me>("me") ?? null);
  const [state, setState] = useState<"loading" | "ready" | "signed_out" | "expired" | "error">(() =>
    peek("me") ? "ready" : "loading",
  );
  const [round, setRound] = useState(0);
  const load = () => setRound((value) => value + 1);
  const [memoryCount, setMemoryCount] = useState<number | null>(null);
  const [welcomeHidden, setWelcomeHidden] = useState(true);
  const [tour, setTour] = useState<"first_visit" | "reopened" | null>(null);
  const [searching, setSearching] = useState(false);
  const [profile, setProfile] = useState(false);
  const [target, setTarget] = useState<ChatTarget | null>(null);
  const [jumpFrom, setJumpFrom] = useState<"search" | "link" | "occasion">("link");
  const [outbox, setOutbox] = useState<Outbox | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    // The reset e-mail's link opens the new-password step even where the account is already open.
    const loading = linkedReset()
      ? Promise.reject(new ApiError("Link de nova senha", 401))
      : Promise.all([api.me(), api.memories().catch(() => null)]);
    // The chat and the panels do not wait for /me: their first requests leave now, at the same time.
    if (!linkedReset() && !new URLSearchParams(window.location.search).has("painel")) {
      prefetchChat();
      api.watches().catch(() => undefined);
    }
    loading
      .then(([person, memories]) => {
        if (!live) return;
        setMe(person);
        setMemoryCount(memories?.length ?? null);
        setWelcomeHidden(welcomeDismissed(person.id));
        setState("ready");
        // What the address asks for: an old conversation link (?em=), the search, the profile, the tour.
        const params = new URLSearchParams(window.location.search);
        const asked = targetFromSearch(window.location.search);
        if (asked) {
          setJumpFrom("link");
          setTarget(asked);
        }
        if (params.has("buscar")) setSearching(true);
        if (params.has("perfil")) setProfile(true);
        const tourAsked = params.has("tour");
        if ([...params.keys()].length) window.history.replaceState(null, "", window.location.pathname);
        setTour((current) => current ?? (tourAsked ? "reopened" : onboardingSeen(person.id) ? null : "first_visit"));
      })
      .catch((error: unknown) => {
        if (!live) return;
        setState((current) =>
          error instanceof ApiError && error.status === 401 ? (current === "ready" ? "expired" : "signed_out") : "error",
        );
      });
    return () => {
      live = false;
    };
  }, [round]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const openSearch = useCallback(() => setSearching(true), []);
  const onArrived = useCallback(
    (found: boolean) => {
      track("chat_jumped", { from: jumpFrom, found });
      setTarget(null);
      if (!found)
        setToast(jumpFrom === "occasion" ? "Essa conversa ficou num painel." : "Não achei essa mensagem na conversa.");
    },
    [jumpFrom],
  );
  const onExpired = useCallback(() => setState("expired"), []);
  const onSignedOut = useCallback(() => {
    setProfile(false);
    setState("signed_out");
  }, []);
  const onOutboxSent = useCallback(() => setOutbox(null), []);
  const send = (next: { kind: "message"; text: string } | { kind: "welcome" }) => setOutbox({ ...next, id: Date.now() });

  if (state === "loading")
    return (
      <p role="status" className="px-5 py-12 text-small text-graphite">
        Carregando…
      </p>
    );
  if (state === "signed_out" || state === "expired") return <SignIn expired={state === "expired"} onDone={load} />;
  if (state === "error" || !me)
    return (
      <main id="conteudo" className="mx-auto max-w-md px-5 py-12">
        <p role="alert" className="text-body text-ink">
          Não consegui falar com a tone agora.
        </p>
        <button type="button" className={`${quiet} mt-4`} onClick={load}>
          Tentar de novo
        </button>
      </main>
    );

  const offerWelcome = !welcomeHidden && memoryCount !== null && memoryCount < WELCOME_MEMORY_FLOOR;
  // The chat goes there once the folha has closed (150 ms) and handed the focus back, so the
  // focus can then move to the message found.
  const goTo = (next: ChatTarget, from: "search" | "occasion") =>
    window.setTimeout(() => {
      setJumpFrom(from);
      setTarget(next);
    }, 200);
  const pick = (match: MessageMatch, query: string) =>
    goTo({ sessionId: match.sessionId, index: match.index, role: match.role, query }, "search");
  return (
    <Shell
      me={me}
      onSearch={openSearch}
      onProfile={() => {
        track("profile_opened");
        setProfile(true);
      }}
      profileOpen={profile}
    >
      <Conversation
        me={me}
        target={target}
        onArrived={onArrived}
        outbox={outbox}
        onOutboxSent={onOutboxSent}
        onExpired={onExpired}
        empty={
          <FirstWords
            me={me}
            offerWelcome={offerWelcome}
            onWelcome={() => {
              track("welcome_chat_started", { from: "chat", memories: memoryCount ?? 0 });
              setWelcomeHidden(true);
              send({ kind: "welcome" });
            }}
            onDismiss={() => {
              dismissWelcome(me.id);
              setWelcomeHidden(true);
              track("welcome_chat_dismissed");
            }}
          />
        }
      />
      {/* The quick notice (components/feedback.md): always in the page, so what it says is announced. */}
      <p
        role="status"
        className="fixed inset-x-4 top-20 z-40 mx-auto w-fit max-w-[26.25rem] rounded-full bg-ink px-[1.125rem] py-3 text-small font-semibold text-on-ink shadow-floating empty:hidden"
      >
        {toast}
      </p>
      {searching ? <SearchDialog onClose={() => setSearching(false)} onPick={pick} /> : null}
      {profile ? (
        <ProfileSheet
          onClose={() => setProfile(false)}
          onSignedOut={onSignedOut}
          onTour={() => setTour("reopened")}
          onWelcome={() => send({ kind: "welcome" })}
          onOpen={(sessionId) => goTo({ sessionId }, "occasion")}
        />
      ) : null}
      {tour ? (
        <Onboarding
          userId={me.id}
          origin={tour}
          onClose={() => {
            setTour(null);
            // "Escrever o meu": the message field is where the person goes next.
            window.setTimeout(() => document.getElementById("mensagem")?.focus(), 0);
          }}
          onStart={(text) => send({ kind: "message", text })}
        />
      ) : null}
    </Shell>
  );
}
