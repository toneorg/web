// Gerado de toneorg/server@4c5f788472c2 (packages/genui-react/src/Reviews.tsx). Não edite aqui.
// Síntese de reviews: what reviews say, as tone read them (spec 2026-11-03):
// YouTube videos and, since 15/11/2026, blogs, Reddit threads and buyers'
// reviews in stores. Every point names its sources and opens them (the video
// at the moment it was said), in a new tab, only when the person clicks.
// Titles, channels, sites and quotes are third-party text, shown as plain text.

import {
  claimSource,
  clock,
  type ReviewClaim,
  type ReviewRunState,
  type ReviewSource,
  type ReviewVideo,
  youtubeAt,
} from "@/tone/shared";
import { Icon } from "./Icon";

const MAX_SOURCES = 2;
/** What shows before "Ver mais": the card stays a reading of a few lines, the rest one tap away. */
const VISIBLE = { matters: 4, consensus: 4, divergences: 3 } as const;

/** Topics are kept in lower case to group them; a heading starts with a capital. */
const heading = (text: string) => text.charAt(0).toLocaleUpperCase("pt-BR") + text.slice(1);

const year = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric" });
const rating = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

/** How each kind of source is named next to it. */
const KIND: Record<ReviewSource["kind"], string> = { blog: "blog", reddit: "Reddit", store: "loja" };

function flags(video: ReviewVideo | undefined): string[] {
  if (!video) return [];
  return [
    video.sponsored ? "publi" : null,
    video.language === "en" ? "de fora do Brasil" : null,
    video.old ? "antigo" : null,
  ].filter((flag): flag is string => Boolean(flag));
}

/** "r/fragrance" for a Reddit thread, the site otherwise. */
function sourceName(source: ReviewSource): string {
  if (source.kind === "reddit") {
    const community = /reddit\.com\/r\/([A-Za-z0-9_]{2,40})\//.exec(source.url)?.[1];
    if (community) return `r/${community}`;
  }
  return source.site;
}

function ratingText(source: ReviewSource): string | null {
  if (source.rating === null) return null;
  const count = source.ratingCount ? ` (${source.ratingCount.toLocaleString("pt-BR")} avaliações)` : "";
  return `nota ${rating.format(source.rating)}${count}`;
}

/** The mark of a link that opens in a new tab, said to the screen reader as well. */
function NewTab() {
  return (
    <>
      <Icon name="external" size={14} stroke={1.5} />
      <span className="visually-hidden"> (abre em nova aba)</span>
    </>
  );
}

interface Lookup {
  claims: Map<string, ReviewClaim>;
  videos: Map<string, ReviewVideo>;
  pages: Map<string, ReviewSource>;
  onOpen?: (sourceId: string) => void;
}

function SourceLink(props: { claim: ReviewClaim } & Lookup) {
  const { claim } = props;
  if (claim.videoId) {
    const video = props.videos.get(claim.videoId);
    const marks = ["vídeo", ...flags(video)];
    const videoId = claim.videoId;
    return (
      <li>
        <a
          className="small"
          href={youtubeAt(videoId, claim.atSeconds)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => props.onOpen?.(videoId)}
          title={claim.quote ?? claim.summary}
        >
          {video?.channel ?? "YouTube"} aos {clock(claim.atSeconds)}
          <NewTab />
        </a>
        <span className="small muted">({marks.join(", ")})</span>
      </li>
    );
  }
  const page = claim.sourceId ? props.pages.get(claim.sourceId) : undefined;
  if (!page) return null;
  return (
    <li>
      <a
        className="small"
        href={page.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => props.onOpen?.(page.id)}
        title={claim.quote ?? claim.summary}
      >
        {sourceName(page)}
        <NewTab />
      </a>
      <span className="small muted">({KIND[page.kind]})</span>
    </li>
  );
}

function Sources(props: { ids: string[] } & Lookup) {
  // One link per source, the first two shown: the rest is counted, so a point stays one line.
  const seen = new Set<string>();
  const each = props.ids.flatMap((id) => {
    const claim = props.claims.get(id);
    if (!claim || seen.has(claimSource(claim))) return [];
    seen.add(claimSource(claim));
    return [claim];
  });
  if (!each.length) return null;
  const shown = each.slice(0, MAX_SOURCES);
  const more = each.length - shown.length;
  return (
    <ul className="review-sources">
      {shown.map((claim) => (
        <SourceLink key={claim.id} claim={claim} {...props} />
      ))}
      {more > 0 ? (
        <li className="small muted">
          +{more} {more === 1 ? "fonte" : "fontes"}
        </li>
      ) : null}
    </ul>
  );
}

/** "3 vídeos, 2 conversas do Reddit e 1 loja". */
export function sourcesSummary(run: Pick<ReviewRunState, "videos" | "sources">): string {
  const count = (kind: ReviewSource["kind"]) => (run.sources ?? []).filter((s) => s.kind === kind).length;
  const plural = (n: number, one: string, many: string) => (n ? `${n} ${n === 1 ? one : many}` : null);
  const parts = [
    plural(run.videos.length, "vídeo no YouTube", "vídeos no YouTube"),
    plural(count("reddit"), "conversa no Reddit", "conversas no Reddit"),
    plural(count("blog"), "blog", "blogs"),
    plural(count("store"), "loja", "lojas"),
  ].filter((part): part is string => Boolean(part));
  return parts.length > 1 ? `${parts.slice(0, -1).join(", ")} e ${parts.at(-1)}` : (parts[0] ?? "nenhuma fonte");
}

function moreLabel(synthesis: NonNullable<ReviewRunState["synthesis"]>, sources: number): string {
  const parts = [
    synthesis.cautions.length
      ? `${synthesis.cautions.length} ${synthesis.cautions.length === 1 ? "cuidado" : "cuidados"}`
      : null,
    synthesis.products.length
      ? `${synthesis.products.length} ${synthesis.products.length === 1 ? "modelo citado" : "modelos citados"}`
      : null,
    `${sources} ${sources === 1 ? "fonte" : "fontes"}`,
  ];
  return parts.filter(Boolean).join(", ");
}

/** While it reads: one line per place (YouTube, Reddit, blogs and stores), each with its own count. */
function Progress(props: { run: ReviewRunState }) {
  const { run } = props;
  const stages = run.stages ?? [];
  const running = run.status === "running";
  if (!stages.length || !running)
    return (
      <p className="small muted" role={running ? "status" : undefined}>
        {run.message}
      </p>
    );
  return (
    <ul className="review-stages" role="status" aria-label="Leitura dos reviews">
      {stages.map((stage) => (
        <li key={stage.kind} className="small" data-status={stage.status}>
          <span className="review-stage-mark" aria-hidden="true">
            {stage.status === "running" ? null : <Icon name={stage.status === "done" ? "check" : "minus"} size={14} />}
          </span>
          <span className={stage.status === "running" ? undefined : "muted"}>{stage.message}</span>
        </li>
      ))}
    </ul>
  );
}

export function ReviewSynthesisCard(props: {
  run: ReviewRunState;
  /** A source was opened: a video id, or a page id (w1, w2…). */
  onOpen?: (sourceId: string) => void;
}) {
  const { run } = props;
  const pagesRead = run.sources ?? [];
  const lookup: Lookup = {
    claims: new Map(run.claims.map((claim) => [claim.id, claim])),
    videos: new Map(run.videos.map((video) => [video.id, video])),
    pages: new Map(pagesRead.map((page) => [page.id, page])),
    onOpen: props.onOpen,
  };
  const sources = (ids: string[]) => <Sources ids={ids} {...lookup} />;
  const total = run.videos.length + pagesRead.length;
  const synthesis = run.status === "completed" ? run.synthesis : null;
  const others = synthesis
    ? [
        ...synthesis.matters
          .slice(VISIBLE.matters)
          .map((m) => ({ text: `${heading(m.topic)}: ${m.why}`, claimIds: m.claimIds })),
        ...synthesis.consensus.slice(VISIBLE.consensus).map((c) => ({ text: c.statement, claimIds: c.claimIds })),
        ...synthesis.divergences
          .slice(VISIBLE.divergences)
          .map((d) => ({ text: `${heading(d.topic)}: ${d.note}`, claimIds: [...d.positiveIds, ...d.negativeIds] })),
      ]
    : [];
  return (
    <section className="card reviews" aria-label={`Reviews de ${run.query}`}>
      <h3>O que os reviews dizem: “{run.query}”</h3>
      {!synthesis ? (
        <Progress run={run} />
      ) : (
        <>
          <p className="small muted">
            Leitura da tone de {sourcesSummary(run)}. Abra a fonte para conferir; o vídeo abre no momento citado.
          </p>
          {synthesis.matters.length ? (
            <div className="review-group">
              <h4>O que importa</h4>
              <ul>
                {synthesis.matters.slice(0, VISIBLE.matters).map((item) => (
                  <li key={item.topic}>
                    <strong>{heading(item.topic)}</strong>: {item.why}
                    {sources(item.claimIds)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {synthesis.consensus.length ? (
            <div className="review-group">
              <h4>Em que concordam</h4>
              <ul>
                {synthesis.consensus.slice(0, VISIBLE.consensus).map((item) => (
                  <li key={item.statement}>
                    {item.statement}
                    {sources(item.claimIds)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {synthesis.divergences.length ? (
            <div className="review-group">
              <h4>Onde discordam</h4>
              <ul>
                {synthesis.divergences.slice(0, VISIBLE.divergences).map((item) => (
                  <li key={item.topic}>
                    <strong>{heading(item.topic)}</strong>: {item.note}
                    <div className="review-sides">
                      <div>
                        <span className="small muted">A favor</span>
                        {sources(item.positiveIds)}
                      </div>
                      <div>
                        <span className="small muted">Contra</span>
                        {sources(item.negativeIds)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <details className="review-more">
            <summary className="small">
              Ver mais: {moreLabel(synthesis, total)}
              <Icon name="down" size={16} />
            </summary>
            {others.length ? (
              <div className="review-group">
                <h4>Outros pontos</h4>
                <ul>
                  {others.map((item) => (
                    <li key={item.text}>
                      {item.text}
                      {sources(item.claimIds)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {synthesis.cautions.length ? (
              <div className="review-group">
                <h4>Cuidados</h4>
                <ul>
                  {synthesis.cautions.map((item) => (
                    <li key={item.statement}>
                      {item.statement}
                      {sources(item.claimIds)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {synthesis.products.length ? (
              <div className="review-group">
                <h4>Modelos citados</h4>
                <ul>
                  {synthesis.products.map((item) => (
                    <li key={item.name}>
                      <strong>{item.name}</strong>: {item.note}
                      {sources(item.claimIds)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="review-group">
              <h4>Fontes lidas</h4>
              <ul className="review-videos">
                {run.videos.map((video) => (
                  <li key={video.id} className="small">
                    <a
                      href={youtubeAt(video.id, 0)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => props.onOpen?.(video.id)}
                    >
                      {video.title}
                      <NewTab />
                    </a>
                    <span className="muted review-source-meta">
                      {[
                        "vídeo",
                        video.channel,
                        video.publishedAt ? year.format(new Date(video.publishedAt)) : null,
                        ...flags(video),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </li>
                ))}
                {pagesRead.map((page) => (
                  <li key={page.id} className="small">
                    <a
                      href={page.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => props.onOpen?.(page.id)}
                    >
                      {page.title}
                      <NewTab />
                    </a>
                    <span className="muted review-source-meta">
                      {[KIND[page.kind], sourceName(page), ratingText(page)].filter(Boolean).join(" · ")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        </>
      )}
    </section>
  );
}
