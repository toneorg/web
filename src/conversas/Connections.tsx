"use client";
// Gmail and Agenda on the profile: what is connected, what was read, and the purchases found in
// the person's order e-mails. Connecting leaves for Google in the same tab; the callback comes
// back to the profile with ?conexao=…&estado=… and this screen says how it went.
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ConnectionProvider,
  ConnectionStatus,
  Purchase,
} from "@/tone/shared";
import { ApiError, api } from "./api";

const quiet =
  "press min-h-11 rounded-full bg-surface px-4 text-ui text-ink shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-50";
const danger =
  "press min-h-11 rounded-full bg-surface px-4 text-ui text-alert shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-50";

const PROVIDER: Record<
  ConnectionProvider,
  { name: string; what: string; read: string }
> = {
  gmail: {
    name: "Gmail",
    what: "Leio só e-mails de confirmação de pedido, para saber o que você já comprou.",
    read: "compras lidas",
  },
  calendar: {
    name: "Agenda",
    what: "Vejo os próximos 60 dias, para lembrar de presentes, viagens e festas.",
    read: "eventos guardados",
  },
};

const NOT_ACTIVE =
  "As conexões com o Google ainda não estão ativas neste servidor.";

export type Outcome = { tone: "ok" | "problem"; text: string } | null;

/** What the callback says in the address: the connection and how it ended. */
export function outcomeOf(search: string): Outcome {
  const params = new URLSearchParams(search);
  const state = params.get("estado");
  const provider = params.get("conexao");
  const name =
    provider === "gmail" || provider === "calendar"
      ? PROVIDER[provider].name
      : null;
  if (state === "expirado")
    return { tone: "problem", text: "O link expirou. Conecte de novo." };
  if (!name) return null;
  if (state === "ok")
    return { tone: "ok", text: `${name} conectado. Já estou lendo.` };
  if (state === "cancelada")
    return {
      tone: "problem",
      text: `Nada foi conectado. Você pode tentar de novo quando quiser.`,
    };
  if (state === "erro")
    return {
      tone: "problem",
      text: `Não consegui conectar o ${name}. Tente de novo.`,
    };
  return null;
}

/** Sends the person to Google's consent screen, in this tab: the callback returns to the profile. */
export async function connect(provider: ConnectionProvider) {
  try {
    const { url } = await api.startConnection(provider);
    window.location.assign(url);
  } catch (error) {
    if (error instanceof ApiError && error.status === 503)
      throw new Error(NOT_ACTIVE, { cause: error });
    throw error;
  }
}

/** What a failed call says: the server's own words, or a plain line when it only gave a code. */
export function failureText(failure: unknown) {
  if (
    failure instanceof ApiError &&
    failure.status >= 500 &&
    /^Erro \d+$/.test(failure.message)
  )
    return "Não consegui agora. Tente de novo em instantes.";
  return failure instanceof Error
    ? failure.message
    : "Não deu certo. Tente de novo.";
}

const day = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
const brl = (amount: number) =>
  amount.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: amount >= 100 ? 0 : 2,
  });

export function ConnectionsView(props: {
  connections: ConnectionStatus[];
  purchases: Purchase[];
  outcome: Outcome;
  /** The provider with a call in flight. */
  busy: ConnectionProvider | null;
  onConnect: (provider: ConnectionProvider) => void;
  onSync: (provider: ConnectionProvider) => void;
  onDisconnect: (provider: ConnectionProvider) => void;
  error?: string | null;
}) {
  return (
    <>
      {/* Always in the page, so the readers announce the text put in it. */}
      <p
        role="status"
        className={`text-small font-medium ${props.outcome?.tone === "ok" ? "text-ink" : "text-alert"}`}
      >
        {props.outcome?.text}
      </p>
      <ul className="flex flex-col gap-3">
        {props.connections.map((connection) => {
          const info = PROVIDER[connection.provider];
          const busy = props.busy === connection.provider;
          return (
            <li
              key={connection.provider}
              className="flex flex-wrap items-center justify-between gap-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-ui text-ink">
                  {info.name}
                  {connection.connected ? (
                    <span className="text-graphite"> · conectado</span>
                  ) : null}
                </p>
                <p className="text-small text-graphite">
                  {connection.connected
                    ? `${connection.items} ${info.read}${connection.lastSyncAt ? ` · lido em ${day(connection.lastSyncAt)}` : ""}`
                    : connection.available
                      ? info.what
                      : `${info.name} ainda não está disponível neste servidor.`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {connection.connected ? (
                  <>
                    <button
                      type="button"
                      className={quiet}
                      disabled={busy}
                      onClick={() => props.onSync(connection.provider)}
                    >
                      {busy ? "Lendo…" : `Ler ${info.name} de novo`}
                    </button>
                    <button
                      type="button"
                      className={danger}
                      disabled={busy}
                      onClick={() => props.onDisconnect(connection.provider)}
                    >
                      {`Desconectar ${info.name}`}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className={quiet}
                    disabled={!connection.available || busy}
                    onClick={() => props.onConnect(connection.provider)}
                  >
                    {busy ? "Abrindo o Google…" : `Conectar ${info.name}`}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {props.error ? (
        <p role="alert" className="text-small font-medium text-alert">
          {props.error}
        </p>
      ) : null}
      {props.purchases.length ? (
        <>
          <h3 className="mt-2 text-ui text-ink">Compras que li nos e-mails</h3>
          <ul className="flex flex-col gap-1" data-ph-mask>
            {props.purchases.map((purchase) => (
              <li key={purchase.id} className="text-small text-ink">
                {purchase.item}
                <span className="text-graphite">
                  {" "}
                  · {purchase.merchant}
                  {purchase.price != null ? ` · ${brl(purchase.price)}` : ""}
                  {purchase.date ? ` · ${day(purchase.date)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </>
  );
}

type Ask = {
  title: string;
  text: string;
  confirm: string;
  busy?: string;
  run: () => Promise<void>;
};

/** The connections with their own loading; `ask` opens the profile's confirmation folha. */
export function Connections(props: { ask: (pending: Ask) => void }) {
  const [connections, setConnections] = useState<ConnectionStatus[] | null>(
    null,
  );
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  // The callback's address, read once; this only renders after the profile has loaded in the browser.
  const [outcome, setOutcome] = useState<Outcome>(() =>
    typeof window === "undefined" ? null : outcomeOf(window.location.search),
  );
  const [busy, setBusy] = useState<ConnectionProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const loaded = useRef(false);

  // Each change of `round` reads everything again (after syncing or disconnecting).
  const [round, setRound] = useState(0);
  const load = useCallback(async () => setRound((value) => value + 1), []);

  useEffect(() => {
    // Cleaned from the address, so a reload does not repeat the message.
    if (outcomeOf(window.location.search))
      window.history.replaceState(null, "", window.location.pathname);
  }, []);

  useEffect(() => {
    // Coming back from Google with the back button, the page may return as it was left.
    const back = (event: PageTransitionEvent) => {
      if (event.persisted) setBusy(null);
    };
    window.addEventListener("pageshow", back);
    return () => window.removeEventListener("pageshow", back);
  }, []);

  useEffect(() => {
    let live = true;
    Promise.all([api.connections(), api.purchases().catch(() => [])])
      .then(([list, bought]) => {
        if (!live) return;
        loaded.current = true;
        setConnections(list);
        setPurchases(bought);
        setFailed(false);
      })
      .catch(() => {
        // A later reload that fails keeps what is already on screen.
        if (live && !loaded.current) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, [round]);

  const run = async (
    provider: ConnectionProvider,
    action: () => Promise<void>,
  ) => {
    setBusy(provider);
    setError(null);
    setOutcome(null);
    try {
      await action();
    } catch (failure) {
      setError(failureText(failure));
    } finally {
      setBusy(null);
    }
  };

  if (failed)
    return (
      <p className="text-small text-graphite">
        Não consegui ver as conexões agora. Abra o perfil de novo mais tarde.
      </p>
    );
  if (!connections)
    return <p className="text-small text-graphite">Carregando…</p>;
  return (
    <ConnectionsView
      connections={connections}
      purchases={purchases}
      outcome={outcome}
      busy={busy}
      error={error}
      onConnect={(provider) =>
        void run(provider, async () => {
          await connect(provider);
        })
      }
      onSync={(provider) =>
        void run(provider, async () => {
          const { added } = await api.syncConnection(provider);
          setOutcome({
            tone: "ok",
            text: added
              ? `Li ${added} ${added === 1 ? "item novo" : "itens novos"}.`
              : "Nada novo.",
          });
          await load();
        })
      }
      onDisconnect={(provider) => {
        const info = PROVIDER[provider];
        const items =
          connections.find((entry) => entry.provider === provider)?.items ?? 0;
        props.ask({
          title: `Desconectar o ${info.name}?`,
          text:
            items > 0
              ? `Eu paro de ler e apago o que veio do ${info.name} (${items} ${items === 1 ? "item" : "itens"}).`
              : `Eu paro de ler o ${info.name}.`,
          confirm: `Desconectar ${info.name}`,
          busy: "Desconectando…",
          run: async () => {
            await api.disconnect(provider);
            await load();
          },
        });
      }}
    />
  );
}
