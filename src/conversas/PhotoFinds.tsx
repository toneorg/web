"use client";
// Busca por foto (22/11/2026): the "Na foto" card. The products the tone found in the person's photo,
// numbered on the photo itself; for each one its crop, how sure the tone is (the exact model, likely,
// or only similar ones), the pages Google Lens found and checked by eye, and "Buscar nas lojas",
// which asks the conversation to search that product in the Brazilian stores. The photo comes as a
// local blob (it never has a public address); once it expires the card keeps the list without it.
import { useEffect, useState } from "react";
import { isCheckoutUrl, type PhotoFind, type PhotoFinds } from "@/tone/shared";
import { track } from "./analytics";
import { api } from "./api";

/** The person's photo as a local blob address, or null while it loads or once it is gone. */
export function usePhotoBlob(photoId: string | null | undefined): string | null {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!photoId) return;
    let url: string | null = null;
    let live = true;
    api
      .photoImage(photoId)
      .then((blob) => {
        if (!live) return;
        url = URL.createObjectURL(blob);
        setSrc(url);
      })
      .catch(() => undefined);
    return () => {
      live = false;
      setSrc(null);
      if (url) URL.revokeObjectURL(url);
    };
  }, [photoId]);
  return src;
}

const IDENTITY: Record<PhotoFind["identity"], string> = {
  exact: "Achei o modelo",
  likely: "Provável",
  generic: "Parecidos",
};

/** The product's name as the person reads it: the brand and model when the tone is sure of them. */
export function findTitle(find: PhotoFind): string {
  if (find.identity === "exact" && find.brand && find.model) return `${find.brand} ${find.model}`;
  return find.name.charAt(0).toUpperCase() + find.name.slice(1);
}

/** Where a box is drawn: the centre of the product, in percent of the photo. */
const centre = (box: PhotoFind["box"]) => ({ top: `${(box[0] + box[2]) / 20}%`, left: `${(box[1] + box[3]) / 20}%` });

/**
 * The crop of one product as a square window on the photo: the image is placed so the box fills
 * the square (with a little room), without stretching it. Needs the photo's natural size.
 */
export function cropStyle(box: PhotoFind["box"], size: { width: number; height: number }) {
  const [y0, x0, y1, x1] = box.map((value) => value / 1000) as [number, number, number, number];
  const side = Math.min(
    Math.max((x1 - x0) * size.width, (y1 - y0) * size.height) * 1.1,
    Math.min(size.width, size.height),
  );
  const cx = ((x0 + x1) / 2) * size.width;
  const cy = ((y0 + y1) / 2) * size.height;
  const left = Math.min(Math.max(cx - side / 2, 0), size.width - side);
  const top = Math.min(Math.max(cy - side / 2, 0), size.height - side);
  return {
    width: `${(size.width / side) * 100}%`,
    height: `${(size.height / side) * 100}%`,
    left: `${(-left / side) * 100}%`,
    top: `${(-top / side) * 100}%`,
  };
}

const outline =
  "press inline-flex min-h-11 items-center justify-center rounded-full bg-surface px-4 text-ui text-ink shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-50";

function Marker(props: { find: PhotoFind }) {
  return (
    <span
      aria-hidden
      style={centre(props.find.box)}
      className="absolute flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ink text-caption font-semibold text-on-ink tabular-nums shadow-raised"
    >
      {props.find.item}
    </span>
  );
}

function Crop(props: { find: PhotoFind; src: string | null; size: { width: number; height: number } | null }) {
  return (
    <div className="relative size-16 shrink-0 overflow-hidden rounded-thumb bg-sunken outline outline-1 -outline-offset-1 outline-image-outline">
      {props.src && props.size ? (
        // eslint-disable-next-line @next/next/no-img-element -- a local blob of the person's own photo
        <img
          src={props.src}
          alt=""
          className="absolute max-w-none"
          style={cropStyle(props.find.box, props.size)}
        />
      ) : null}
      <span className="absolute top-1 left-1 flex size-5 items-center justify-center rounded-full bg-ink text-label font-semibold text-on-ink tabular-nums">
        {props.find.item}
      </span>
    </div>
  );
}

export function PhotoFindsView(props: {
  finds: PhotoFinds;
  /** The local address of the photo, once loaded. */
  src: string | null;
  /** The photo's natural size, once it loaded (for the crops). */
  size: { width: number; height: number } | null;
  onSize?: (size: { width: number; height: number }) => void;
  busy: boolean;
  onSearch: (find: PhotoFind) => void;
  onOpen?: (find: PhotoFind, verdict: "same" | "similar") => void;
}) {
  const { finds } = props.finds;
  return (
    <section aria-label="Produtos na sua foto" className="flex flex-col gap-4 rounded-card bg-surface p-5 shadow-raised">
      <div className="flex flex-col gap-1">
        <h3 className="text-subheading text-ink">Na foto</h3>
        <p className="text-small text-graphite">
          {finds.length === 1 ? "Achei 1 produto." : `Achei ${finds.length} produtos.`} Os links abrem as páginas que a
          busca por imagem achou e a tone conferiu.
        </p>
      </div>
      {props.src ? (
        <div className="flex justify-center rounded-panel bg-sunken p-2">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element -- a local blob of the person's own photo */}
            <img
              src={props.src}
              alt="Sua foto, com os produtos numerados"
              className="block max-h-80 w-auto rounded-thumb outline outline-1 -outline-offset-1 outline-image-outline"
              onLoad={(event) =>
                props.onSize?.({
                  width: event.currentTarget.naturalWidth,
                  height: event.currentTarget.naturalHeight,
                })
              }
            />
            {finds.map((find) => (
              <Marker key={find.item} find={find} />
            ))}
          </div>
        </div>
      ) : null}
      <ol className="flex flex-col divide-y divide-rule">
        {finds.map((find) => {
          const links = find.matches.filter((match) => !isCheckoutUrl(match.link)).slice(0, 3);
          return (
            <li key={find.item} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
              <div className="flex items-start gap-3">
                <Crop find={find} src={props.src} size={props.size} />
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="text-ui text-ink">{findTitle(find)}</p>
                  <p className="text-small text-graphite">
                    <span
                      className={`me-2 inline-block rounded-tag px-2 text-caption ${
                        find.identity === "exact" ? "bg-accent-soft text-accent-text" : "bg-sunken text-graphite"
                      }`}
                    >
                      {IDENTITY[find.identity]}
                    </span>
                    {find.identity === "exact" ? find.name : find.category}
                  </p>
                </div>
              </div>
              {links.length ? (
                <ul className="flex flex-col">
                  {links.map((match) => (
                    <li key={match.link}>
                      <a
                        href={match.link}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        onClick={() => props.onOpen?.(find, match.verdict)}
                        className="flex min-h-11 items-center gap-2 rounded-input px-2 -mx-2 hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                      >
                        <span className="shrink-0 text-small font-medium text-ink">{match.source}</span>
                        <span className="min-w-0 truncate text-small text-graphite">{match.title}</span>
                        <span className="ms-auto shrink-0 text-caption text-graphite">
                          {match.verdict === "same" ? "Igual" : "Parecido"}
                        </span>
                        <span className="sr-only">(abre em nova aba)</span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-small text-graphite">Sem página igual pela imagem. Nas lojas, a tone busca pela descrição.</p>
              )}
              <button
                type="button"
                className={`${outline} self-start`}
                disabled={props.busy}
                aria-label={`Buscar nas lojas: ${findTitle(find)}`}
                onClick={() => props.onSearch(find)}
              >
                Buscar nas lojas
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** The card in the conversation: loads the photo and measures it for the crops. */
export function PhotoFindsCard(props: { finds: PhotoFinds; busy: boolean; onSearch: (find: PhotoFind) => void }) {
  const src = usePhotoBlob(props.finds.photoId);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  return (
    <PhotoFindsView
      finds={props.finds}
      src={src}
      size={size}
      onSize={setSize}
      busy={props.busy}
      onSearch={(find) => {
        track("photo_find_search", { item: find.item, identity: find.identity });
        props.onSearch(find);
      }}
      onOpen={(find, verdict) => track("photo_find_opened", { item: find.item, identity: find.identity, verdict })}
    />
  );
}
