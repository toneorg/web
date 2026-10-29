// Gerado de toneorg/extension@bc3273ad0a23 (packages/shared/src/media.ts). Não edite aqui.
// Videos of the product the person is looking at: TikToks found by the
// product's name. Titles and authors come from third parties, so
// the panel shows them as plain text and the model never reads them.
import * as z from "zod";

export const MediaPlatform = z.enum(["tiktok"]);
export type MediaPlatform = z.infer<typeof MediaPlatform>;

/** The ids go into an embed address, so they are checked to the platform's own shape. */
const VIDEO_ID: Record<MediaPlatform, RegExp> = {
  tiktok: /^\d{8,25}$/,
};

export const MediaVideo = z
  .object({
    platform: MediaPlatform,
    id: z.string(),
    url: z.string(),
    title: z.string().max(300),
    author: z.string().max(100).nullable(),
    views: z.number().int().min(0).nullable(),
    thumbnail: z.string().nullable(),
  })
  .refine((video) => VIDEO_ID[video.platform].test(video.id), { message: "id de vídeo inválido" });
export type MediaVideo = z.infer<typeof MediaVideo>;

export const ProductMedia = z.object({
  /** The words searched for, derived from the product's title. */
  query: z.string(),
  /** Conversations saved while YouTube Shorts were searched too keep only their TikToks. */
  videos: z.preprocess(
    (videos) =>
      Array.isArray(videos)
        ? videos.filter((video) => MediaPlatform.safeParse((video as { platform?: unknown })?.platform).success)
        : videos,
    z.array(MediaVideo).max(24),
  ),
});
export type ProductMedia = z.infer<typeof ProductMedia>;

export const MediaRequest = z.object({
  sessionId: z.string(),
  productTitle: z.string().min(1).max(400),
});
export type MediaRequest = z.infer<typeof MediaRequest>;

/** The name of the component that draws a `ProductMedia` in the conversation. */
export const MEDIA_COMPONENT = "show_media";

export function isVideoId(platform: MediaPlatform, id: string): boolean {
  return VIDEO_ID[platform].test(id);
}

/**
 * The search words for a store title. Amazon titles pile up selling points after a
 * separator ("Echo Dot 5ª geração | O Echo Dot com o melhor som…"): the name is
 * what comes before it, kept to a few words.
 */
export function mediaQuery(title: string): string {
  const name = title.split(/\s[|–—-]\s|[|,;(]/)[0] ?? title;
  const words = name.replace(/\s+/g, " ").trim().split(" ").slice(0, 8);
  return words.join(" ").slice(0, 80).trim() || title.slice(0, 80).trim();
}

/** The player address of a video, with autoplay: it only loads after the person taps it. */
export function embedUrl(video: Pick<MediaVideo, "platform" | "id">): string {
  if (!isVideoId(video.platform, video.id)) throw new Error("id de vídeo inválido");
  return `https://www.tiktok.com/player/v1/${video.id}?autoplay=1&rel=0&description=0`;
}
