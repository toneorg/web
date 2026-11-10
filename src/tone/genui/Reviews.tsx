// Gerado de toneorg/extension@440b05322b9f (packages/genui-react/src/Reviews.tsx). Não edite aqui.
// Síntese de reviews: what YouTube reviews say, as tone read them (spec
// 2026-11-03). Every point names its videos and opens the moment it was said,
// on YouTube, in a new tab, only when the person clicks. Titles, channels and
// quotes are third-party text, shown as plain text.

import { clock, type ReviewClaim, type ReviewRunState, type ReviewVideo, youtubeAt } from "@/tone/shared";
import { Icon } from "./Icon";

const MAX_SOURCES = 2;
/** What shows before "Ver mais": the card stays a reading of a few lines, the rest one tap away. */
const VISIBLE = { matters: 4, consensus: 4, divergences: 3 } as const;

/** Topics are kept in lower case to group them; a heading starts with a capital. */
const heading = (text: string) => text.charAt(0).toLocaleUpperCase("pt-BR") + text.slice(1);

const year = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric" });

function flags(video: ReviewVideo | undefined): string[] {
  if (!video) return [];
  return [
    video.sponsored ? "publi" : null,
    video.language === "en" ? "de fora do Brasil" : null,
    video.old ? "antigo" : null,
  ].filter((flag): flag is string => Boolean(flag));
}

function Sources(props: {
  ids: string[];
  claims: Map<string, ReviewClaim>;
  videos: Map<string, ReviewVideo>;
  onOpen?: (videoId: string) => void;
}) {
  // One moment per video, the first two shown: the rest is counted, so a point stays one line.
  const seen = new Set<string>();
  const each = props.ids.flatMap((id) => {
    const claim = props.claims.get(id);
    if (!claim || seen.has(claim.videoId)) return [];
    seen.add(claim.videoId);
    return [claim];
  });
  if (!each.length) return null;
  const shown = each.slice(0, MAX_SOURCES);
  const more = each.length - shown.length;
  return (
    <ul className="review-sources">
      {shown.map((claim) => {
        const video = props.videos.get(claim.videoId);
        const marks = flags(video);
        return (
          <li key={claim.id}>
            <a
              className="small"
              href={youtubeAt(claim.videoId, claim.atSeconds)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => props.onOpen?.(claim.videoId)}
              title={claim.quote ?? claim.summary}
            >
              {video?.channel ?? "YouTube"} aos {clock(claim.atSeconds)}
              <Icon name="external" size={14} stroke={1.5} />
            </a>
            {marks.length ? <span className="small muted"> · {marks.join(", ")}</span> : null}
          </li>
        );
      })}
      {more > 0 ? (
        <li className="small muted">
          +{more} {more === 1 ? "vídeo" : "vídeos"}
        </li>
      ) : null}
    </ul>
  );
}

function moreLabel(synthesis: NonNullable<ReviewRunState["synthesis"]>, videos: number): string {
  const parts = [
    synthesis.cautions.length ? `${synthesis.cautions.length} cuidados` : null,
    synthesis.products.length ? `${synthesis.products.length} modelos citados` : null,
    `${videos} vídeos`,
  ];
  return parts.filter(Boolean).join(", ");
}

export function ReviewSynthesisCard(props: { run: ReviewRunState; onOpen?: (videoId: string) => void }) {
  const { run } = props;
  const claims = new Map(run.claims.map((claim) => [claim.id, claim]));
  const videos = new Map(run.videos.map((video) => [video.id, video]));
  const sources = (ids: string[]) => <Sources ids={ids} claims={claims} videos={videos} onOpen={props.onOpen} />;
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
        <p className="small muted" role={run.status === "running" ? "status" : undefined}>
          {run.message}
        </p>
      ) : (
        <>
          <p className="small muted">
            Leitura da tone de {run.videos.length} reviews no YouTube. Abra o vídeo no momento citado para conferir.
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
              Ver mais: {moreLabel(synthesis, run.videos.length)}
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
              <h4>Vídeos lidos</h4>
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
                    </a>
                    <span className="muted">
                      {" "}
                      ·{" "}
                      {[
                        video.channel,
                        video.publishedAt ? year.format(new Date(video.publishedAt)) : null,
                        ...flags(video),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
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
