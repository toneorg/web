// Gerado de toneorg/extension@cab9f784af9d (packages/genui-react/src/Media.tsx). Não edite aqui.
// Short videos of the product (TikTok). Each one is a cover
// first; the player loads only when the person taps it, so a list of videos
// costs nothing until one is watched. Titles and authors are third-party text,
// shown as plain text.

import { embedUrl, type MediaPlatform, type MediaVideo, type ProductMedia } from "@/tone/shared";
import { useState } from "react";
import { Icon } from "./Icon";

const PLATFORMS: { platform: MediaPlatform; label: string }[] = [{ platform: "tiktok", label: "TikTok" }];

const compact = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });

function VideoCard(props: { video: MediaVideo; label: string }) {
  const { video } = props;
  const [playing, setPlaying] = useState(false);
  const [noCover, setNoCover] = useState(false);
  const meta = [video.author, video.views === null ? null : `${compact.format(video.views)} visualizações`]
    .filter(Boolean)
    .join(" · ");
  return (
    <article className="video">
      {playing ? (
        <iframe
          className="video-frame"
          src={embedUrl(video)}
          title={video.title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button type="button" className="video-frame video-cover" onClick={() => setPlaying(true)}>
          {video.thumbnail && !noCover ? (
            <img
              src={video.thumbnail}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setNoCover(true)}
            />
          ) : null}
          <span className="video-play" aria-hidden="true">
            <Icon name="play" />
          </span>
          <span className="visually-hidden">Assistir: {video.title}</span>
        </button>
      )}
      <div className="video-title">{video.title}</div>
      {meta ? <div className="small muted">{meta}</div> : null}
      <a className="video-link small" href={video.url} target="_blank" rel="noopener noreferrer">
        <Icon name="external" size={16} /> Abrir no {props.label}
      </a>
    </article>
  );
}

export function ProductVideos(props: { media: ProductMedia }) {
  const { media } = props;
  const groups = PLATFORMS.map((group) => ({
    ...group,
    videos: media.videos.filter((video) => video.platform === group.platform),
  })).filter((group) => group.videos.length > 0);
  return (
    <section className="card" aria-label={`Vídeos de ${media.query}`}>
      <h3>Vídeos de “{media.query}”</h3>
      {groups.length === 0 ? (
        <p className="small muted">Não achei vídeos curtos deste produto.</p>
      ) : (
        groups.map((group) => (
          <div key={group.platform} className="video-group">
            <h4 className="video-group-title">{group.label}</h4>
            <div className="videos">
              {group.videos.map((video) => (
                <VideoCard key={video.id} video={video} label={group.label} />
              ))}
            </div>
          </div>
        ))
      )}
    </section>
  );
}
