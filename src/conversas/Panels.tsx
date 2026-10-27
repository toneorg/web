"use client";
// T16: the person's own panels, on the left of the web app. Each one is
// something the person created in a conversation: a watch on a product's price
// or on new products, with its latest reading. The balance closes the rail.
// The panels only read; changing a watch happens in the conversation that made it.
import Link from "next/link";
import { useEffect, useState } from "react";
import { describeWatch, type Me, type Watch, type WatchResult } from "@/tone/shared";
import { api } from "./api";

const STATUS: Record<Watch["status"], string> = {
  draft: "Rascunho",
  active: "Ativo",
  paused: "Pausado",
  deleted: "Apagado",
};
const usd = (value: number) =>
  `US$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const when = (iso: string) => new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

interface Panel {
  watch: Watch;
  latest: WatchResult | null;
}

/** The lowest comparable price of a reading, as the store showed it. */
export function lowestOf(result: WatchResult | null): string | null {
  const priced = (result?.summary.matches ?? []).filter((match) => match.amount !== null);
  priced.sort((a, b) => (a.amount ?? 0) - (b.amount ?? 0));
  return priced[0]?.priceText ?? null;
}

export function Panels(props: { me: Me }) {
  const [panels, setPanels] = useState<Panel[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    api
      .watches()
      .then(async (watches) => {
        const shown = watches.filter((watch) => watch.status !== "deleted");
        const latest = await Promise.all(
          shown.map((watch) =>
            watch.confirmed ? api.watchResults(watch.id).then((list) => list[0] ?? null, () => null) : null,
          ),
        );
        if (live) setPanels(shown.map((watch, index) => ({ watch, latest: latest[index] ?? null })));
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, []);
  const budget = props.me.budget;
  return (
    <>
      <section aria-labelledby="titulo-paineis" className="flex flex-col gap-3">
        <h2 id="titulo-paineis" className="text-subheading text-ink">
          Seus painéis
        </h2>
        {failed ? (
          <p className="text-small text-graphite">Não consegui carregar seus painéis agora.</p>
        ) : !panels ? (
          <p className="text-small text-graphite">Carregando…</p>
        ) : panels.length === 0 ? (
          <p className="rounded-card bg-surface p-5 text-small text-graphite shadow-raised">
            Nada por aqui ainda. Peça numa conversa, por exemplo “me avise quando o fone baixar de R$ 300”, e o
            acompanhamento aparece aqui depois que você confirmar.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {panels.map(({ watch, latest }) => {
              const rule = watch.confirmed ?? watch.draft;
              const lines = describeWatch(rule);
              const what = lines[0];
              const condition = lines.find((line) => line.startsWith("Avisar"));
              const lowest = lowestOf(latest);
              const body = (
                <>
                  <span className="flex items-start justify-between gap-2">
                    <span className="text-ui text-ink">{what?.replace(/^(Acompanhar|Procurar novidades): /, "")}</span>
                    <span className="shrink-0 rounded-tag bg-sunken px-2 py-0.5 text-label text-graphite">
                      {STATUS[watch.status]}
                    </span>
                  </span>
                  {condition ? <span className="text-caption text-graphite">{condition}</span> : null}
                  {lowest ? (
                    <span className="rounded-panel bg-sunken p-4">
                      <span className="block text-caption text-graphite">Menor preço observado</span>
                      <span className="display-sm block font-display text-ink tabular-nums">{lowest}</span>
                      {latest ? <span className="block text-caption text-graphite">em {when(latest.observedAt)}</span> : null}
                    </span>
                  ) : latest ? (
                    <span className="text-caption text-graphite">{latest.summary.message}</span>
                  ) : watch.status === "draft" ? (
                    <span className="text-caption text-graphite">Esperando sua confirmação na conversa.</span>
                  ) : (
                    <span className="text-caption text-graphite">
                      Primeira leitura{watch.nextCheckAt ? ` em ${when(watch.nextCheckAt)}` : " em breve"}.
                    </span>
                  )}
                  {latest?.conditionMet ? <span className="text-ui text-ink">Condição atingida</span> : null}
                </>
              );
              const card =
                "flex flex-col gap-2 rounded-card bg-surface p-5 shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
              return (
                <li key={watch.id}>
                  {watch.sessionId ? (
                    <Link href={`/conversas/${watch.sessionId}`} className={card}>
                      {body}
                    </Link>
                  ) : (
                    <div className={card}>{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
      {budget ? (
        <section aria-labelledby="titulo-saldo" className="flex flex-col gap-2 rounded-card bg-surface p-5 shadow-raised">
          <h2 id="titulo-saldo" className="text-subheading text-ink">
            Uso da tone
          </h2>
          <p className="text-small text-graphite">Últimos sete dias, o mesmo saldo da extensão.</p>
          <div className="grid grid-cols-2 gap-2">
            <span className="rounded-panel bg-sunken p-4">
              <span className="block text-caption text-graphite">Disponível</span>
              <span className="block text-ui text-ink tabular-nums">{usd(budget.availableUsd)}</span>
            </span>
            <span className="rounded-panel bg-sunken p-4">
              <span className="block text-caption text-graphite">Teto</span>
              <span className="block text-ui text-ink tabular-nums">{usd(budget.weeklyCapUsd)}</span>
            </span>
          </div>
        </section>
      ) : null}
    </>
  );
}
