"use client";
// T06: one conversation on the web, the same one the extension shows. The
// agent researches through the server; store-tab actions stay in the extension.
import Link from "next/link";
import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import posthog from "posthog-js";
import { PickedProductBar, ProductVideos } from "@/tone/genui";
import {
  type AgentEvent,
  MEDIA_COMPONENT,
  type Me,
  type PickedProduct,
  ProductMedia,
  type ResearchRunState,
  reduceResearchRuns,
  storeLabel,
  type TurnInput,
} from "@/tone/shared";
import { splitAnswer } from "@/tone/shared/genui";
import { ApiError, api, streamTurn } from "./api";
import { Program, type ProgramHost, STORE_HOSTS } from "./Program";
import { LocalResearch } from "./LocalResearch";
import { ResearchRun } from "./ResearchRun";
import { Shell } from "./Shell";
import { SignIn } from "./SignIn";

type Item =
  | { id: string; kind: "user"; text: string }
  | { id: string; kind: "assistant"; text: string; streaming?: boolean }
  | { id: string; kind: "notice"; text: string; error?: boolean }
  | { id: string; kind: "research"; run: ResearchRunState }
  /** TikToks of a product, asked for from the picked product above the composer. */
  | { id: string; kind: "media"; media: ProductMedia };

let counter = 0;
const uid = () => `w${Date.now().toString(36)}${(++counter).toString(36)}`;

export function Conversation(props: { sessionId: string }) {
  const { sessionId } = props;
  const [items, setItems] = useState<Item[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "expired" | "error">("loading");
  const [draft, setDraft] = useState("");
  const [me, setMe] = useState<Me | null>(null);
  const [busy, setBusy] = useState(false);
  /** The product picked from a component: it goes with every message until the person lets it go. */
  const [picked, setPicked] = useState<PickedProduct | null>(null);
  const controller = useRef<AbortController | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  // Each change of `round` loads the conversation again (after signing in, retrying).
  const [round, setRound] = useState(0);
  const load = () => setRound((value) => value + 1);
  useEffect(() => {
    let live = true;
    Promise.all([api.transcript(sessionId), api.researchRuns(sessionId), api.me(), round])
      .then(([transcript, runs, person]) => {
        if (!live) return;
        setMe(person);
        setItems([
        ...transcript.map((item): Item => {
          if (item.kind === "user") return { id: uid(), kind: "user", text: item.text };
          if (item.kind === "assistant") return { id: uid(), kind: "assistant", text: item.text };
          const media = item.component.name === MEDIA_COMPONENT ? ProductMedia.safeParse(item.component.props) : null;
          return media?.success
            ? { id: uid(), kind: "media", media: media.data }
            : { id: uid(), kind: "notice", text: "Um quadro desta conversa aparece completo na extensão." };
        }),
        ...runs.map((run): Item => ({ id: `run-${run.runId}`, kind: "research", run })),
        ]);
        setState("ready");
      })
      .catch((error: unknown) => {
        if (!live) return;
        const status = error instanceof ApiError ? error.status : 0;
        setState(status === 401 ? "expired" : status === 404 ? "missing" : "error");
      });
    return () => {
      live = false;
    };
  }, [sessionId, round]);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [items.length]);

  const fold = useCallback(
    (event: Extract<AgentEvent, { type: "progress" | "research_result" }>) =>
      setItems((list) => {
        const runId = event.type === "progress" ? event.progress.runId : event.result.id;
        const index = list.findIndex((item) => item.kind === "research" && item.run.runId === runId);
        const current = index >= 0 ? (list[index] as Extract<Item, { kind: "research" }>).run : undefined;
        const before = current ? { [runId]: current } : {};
        const after = reduceResearchRuns(before, event, sessionId);
        const run = after[runId];
        if (after === before || !run) return list;
        if (index < 0) return [...list, { id: `run-${runId}`, kind: "research", run }];
        return list.map((item, at) => (at === index ? { id: item.id, kind: "research" as const, run } : item));
      }),
    [sessionId],
  );

  const runTurn = useCallback(
    async (input: TurnInput) => {
      const abort = new AbortController();
      controller.current = abort;
      setBusy(true);
      let assistant: string | null = null;
      try {
        await streamTurn(
          sessionId,
          input,
          (event) => {
            switch (event.type) {
              case "text": {
                if (!assistant) {
                  const id = uid();
                  assistant = id;
                  setItems((list) => [...list, { id, kind: "assistant", text: event.delta, streaming: true }]);
                } else {
                  const id = assistant;
                  setItems((list) =>
                    list.map((item) => (item.id === id && item.kind === "assistant" ? { ...item, text: item.text + event.delta } : item)),
                  );
                }
                break;
              }
              case "progress":
              case "research_result":
                fold(event);
                break;
              case "memory_saved":
                setItems((list) => [...list, { id: uid(), kind: "notice", text: `Anotei: ${event.key.replace(/[._]/g, " ")} — ${event.value}` }]);
                break;
              case "error":
                setItems((list) => [
                  ...list,
                  {
                    id: uid(),
                    kind: "notice",
                    error: true,
                    text:
                      event.code === "budget_exceeded"
                        ? `${event.message} As conversas e resultados anteriores continuam aqui.`
                        : event.message,
                  },
                ]);
                break;
              default:
                break;
            }
          },
          abort.signal,
        );
      } catch (error) {
        if (!abort.signal.aborted) {
          if (error instanceof ApiError && error.status === 401) setState("expired");
          else
            setItems((list) => [
              ...list,
              { id: uid(), kind: "notice", error: true, text: "Perdi a conexão com a tone. O que já chegou continua aqui; tente de novo." },
            ]);
        }
      } finally {
        setItems((list) => list.map((item) => (item.kind === "assistant" && item.streaming ? { ...item, streaming: false } : item)));
        if (controller.current === abort) controller.current = null;
        setBusy(false);
      }
    },
    [fold, sessionId],
  );

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy || state !== "ready") return;
      setDraft("");
      setItems((list) => [...list, { id: uid(), kind: "user", text: trimmed }]);
      posthog.capture("conversation_message_sent");
      await runTurn({ type: "message", text: trimmed, page: null, ...(picked ? { product: picked } : {}) });
    },
    [busy, picked, runTurn, state],
  );

  /** "See videos of this product": no model involved, the server searches TikTok and saves the result. */
  const showMedia = async () => {
    if (!picked || busy) return;
    setBusy(true);
    setItems((list) => [...list, { id: uid(), kind: "user", text: "Ver vídeos deste produto" }]);
    try {
      const media = await api.media(sessionId, picked.title);
      setItems((list) => [...list, { id: uid(), kind: "media", media }]);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) setState("expired");
      else
        setItems((list) => [
          ...list,
          {
            id: uid(),
            kind: "notice",
            error: true,
            text: error instanceof ApiError ? error.message : "Perdi a conexão com a tone. Tente de novo.",
          },
        ]);
    } finally {
      setBusy(false);
    }
  };
  // T14: a local run is followed by reading its saved state until it ends (about every 2 s, at most 12 min).
  const [following, setFollowing] = useState<string | null>(null);
  useEffect(() => {
    if (!following) return;
    let live = true;
    const started = Date.now();
    const timer = setInterval(() => {
      api
        .researchRuns(sessionId)
        .then((runs) => {
          if (!live) return;
          const run = runs.find((entry) => entry.runId === following);
          if (!run) return;
          setItems((list) => {
            const index = list.findIndex((item) => item.kind === "research" && item.run.runId === run.runId);
            const item = { id: `run-${run.runId}`, kind: "research" as const, run };
            return index < 0 ? [...list, item] : list.map((entry, at) => (at === index ? item : entry));
          });
          if (run.terminal || Date.now() - started > 12 * 60_000) setFollowing(null);
        })
        .catch(() => undefined);
    }, 2000);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [following, sessionId]);

  // T16: a conversation started from the home page arrives with its first message; it is sent once.
  const first = useRef<string | null>(
    typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("primeira"),
  );
  useEffect(() => {
    const text = first.current;
    if (!text || state !== "ready" || busy) return;
    first.current = null;
    window.history.replaceState(null, "", window.location.pathname);
    void send(text);
  }, [state, busy, send]);

  const stop = () => {
    controller.current?.abort();
    setItems((list) => [...list, { id: uid(), kind: "notice", text: "Parei. O que já chegou continua aqui." }]);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send(draft);
    }
  };

  if (state === "expired") return <SignIn expired onDone={load} />;
  if (state === "missing")
    return (
      <main id="conteudo" className="mx-auto max-w-md px-5 py-12">
        <p className="text-body text-ink">Esta conversa não existe ou é de outra conta.</p>
        <Link href="/conversas" className="mt-4 inline-block text-ui text-ink underline">
          Ver suas conversas
        </Link>
      </main>
    );
  if (state === "error")
    return (
      <main id="conteudo" className="mx-auto max-w-md px-5 py-12">
        <p role="alert" className="text-body text-ink">
          Não consegui abrir a conversa agora.
        </p>
        <button type="button" className="mt-4 min-h-11 rounded-full bg-surface px-4 text-ui text-ink shadow-raised" onClick={load}>
          Tentar de novo
        </button>
      </main>
    );

  const lastAssistant = [...items].reverse().find((item) => item.kind === "assistant")?.id;
  const hostFor = (id: string): ProgramHost => ({
    sessionId,
    interactive: id === lastAssistant && !busy,
    answer: (answers, display) => {
      if (busy) return;
      setItems((list) => [...list, { id: uid(), kind: "user", text: display }]);
      void runTurn({ type: "ui_answer", answers, page: null });
    },
    say: (text) => void send(text),
    picked: picked?.url ?? null,
    pick: setPicked,
  });

  return (
    <Shell me={me} current="conversas">
    <main id="conteudo" className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 py-2">
        <Link href="/conversas" className="min-h-11 content-center text-ui text-ink underline-offset-4 hover:underline">
          ← Conversas
        </Link>
        <p className="text-caption text-graphite">{researchNote(me)}</p>
      </header>
      <div
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        data-ph-mask
        className="flex flex-1 flex-col gap-4 pb-6"
      >
        {state === "loading" ? <p className="text-small text-graphite">Carregando a conversa…</p> : null}
        {items.map((item) => {
          if (item.kind === "user")
            return (
              <p key={item.id} className="self-end rounded-panel bg-ink px-4 py-3 text-body text-on-ink">
                {item.text}
              </p>
            );
          if (item.kind === "notice")
            return (
              <p key={item.id} role={item.error ? "alert" : undefined} className={`text-small ${item.error ? "font-medium text-alert" : "text-graphite"}`}>
                {item.text}
              </p>
            );
          if (item.kind === "research") return <ResearchRun key={item.id} run={item.run} />;
          if (item.kind === "media") return <ProductVideos key={item.id} media={item.media} />;
          return (
            <div key={item.id} className="flex flex-col gap-3">
              {splitAnswer(item.text).map((part, index) =>
                part.kind === "text" ? (
                  <p key={index} className="whitespace-pre-wrap text-body text-ink">
                    {part.text}
                  </p>
                ) : (
                  <Program key={index} code={part.code} streaming={Boolean(item.streaming) && !part.complete} host={hostFor(item.id)} />
                ),
              )}
            </div>
          );
        })}
        <div ref={bottom} />
      </div>
      {state === "ready" && !busy && !me?.remoteStores?.length ? (
        <div className="flex flex-col gap-2 pb-3">
          <LocalResearch
            sessionId={sessionId}
            suggestion={[...items].reverse().find((item) => item.kind === "user")?.text ?? ""}
            onStarted={(runId) => setFollowing(runId)}
          />
          {following ? (
            <button
              type="button"
              onClick={() => void api.stopLocalRun(following).finally(() => setFollowing(null))}
              className="min-h-11 self-start rounded-full px-4 text-ui text-ink focus-visible:outline-2 focus-visible:outline-ink"
            >
              Parar a pesquisa no meu Chrome
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="sticky bottom-0 flex flex-col gap-2 bg-paper pb-5 pt-3">
        {busy ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-small text-graphite">Trabalhando…</span>
            <button type="button" onClick={stop} className="min-h-11 rounded-full bg-surface px-4 text-ui text-ink shadow-raised focus-visible:outline-2 focus-visible:outline-ink">
              Parar
            </button>
          </div>
        ) : null}
        {picked ? (
          <PickedProductBar
            product={picked}
            storeHosts={STORE_HOSTS}
            busy={busy}
            onVideos={() => void showMedia()}
            onRemove={() => setPicked(null)}
          />
        ) : null}
        <div className="flex items-end gap-2">
          <label htmlFor="mensagem" className="sr-only">
            Mensagem
          </label>
          <textarea
            id="mensagem"
            rows={2}
            maxLength={4000}
            value={draft}
            placeholder="O que você procura?"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            disabled={state !== "ready"}
            className="min-h-13 flex-1 resize-none rounded-input bg-surface px-4 py-3 text-body text-ink shadow-raised focus-visible:outline-2 focus-visible:outline-ink"
          />
          <button
            type="button"
            disabled={busy || state !== "ready" || !draft.trim()}
            onClick={() => void send(draft)}
            className="min-h-13 rounded-full bg-ink px-6 text-ui text-on-ink disabled:bg-rule disabled:text-graphite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Enviar
          </button>
        </div>
      </div>
    </main>
    </Shell>
  );
}

/** T16: what the research of this page can do, said in the header. */
export function researchNote(me: Me | null): string {
  const remote = me?.remoteStores ?? [];
  if (!remote.length) return "Pesquisa pelo servidor · ações na loja só pela extensão";
  return `Pesquisa pelo servidor e em ${remote.map(storeLabel).join(", ")} por navegador remoto, sem abrir abas`;
}
