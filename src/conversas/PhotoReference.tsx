"use client";
// The person's photo, attached to the next message (busca por foto, 22/11/2026). The photo is shrunk
// and re-encoded in the browser first (hosting caps a request body near 4.5 MB and base64 adds a
// third), then goes to the server as base64; the image comes back from photos/:id/image into a local
// blob: it never gets a public address. The server finds its products when the message is sent.
import { useCallback, useRef, useState } from "react";
import { color } from "@toneorg/design";
import { CameraIcon } from "@/components/icons";
import type { PhotoSummary } from "@/tone/shared";
import { track } from "./analytics";
import { api } from "./api";
import { usePhotoBlob } from "./PhotoFinds";

/** The longest side after shrinking, in pixels. */
export const MAX_SIDE = 2048;
/** The most base64 text a photo may weigh on the wire: under the ~4.5 MB a request body may have. */
export const MAX_BASE64_LENGTH = 4_000_000;
/** When the browser cannot re-encode (HEIC, no canvas), the file goes as it is, up to this size. */
export const MAX_RAW_BYTES = Math.floor((MAX_BASE64_LENGTH * 3) / 4);
export const TOO_BIG = "A foto é grande demais para enviar.";

/** The size to draw a photo at: the same shape, the longest side no more than `max`, never enlarged. */
export function fitWithin(width: number, height: number, max = MAX_SIDE): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/** Whether `bytes` of file still fit in the request once written as base64. */
export const fitsOnTheWire = (bytes: number) => Math.ceil(bytes / 3) * 4 <= MAX_BASE64_LENGTH;

/**
 * What goes to the server: the photo shrunk to 2048 px and re-encoded as JPEG (EXIF goes with it).
 * If the browser cannot decode it (HEIC, say), the raw file goes, if it fits; if it is still too
 * big after re-encoding, the photo is refused.
 */
export async function prepareFile(file: File): Promise<Blob> {
  let encoded: Blob | null = null;
  try {
    const bitmap = await createImageBitmap(file);
    try {
      const size = fitWithin(bitmap.width, bitmap.height);
      const canvas = document.createElement("canvas");
      canvas.width = size.width;
      canvas.height = size.height;
      const context = canvas.getContext("2d");
      // No canvas: throw, so the raw file goes instead of a blank upload.
      if (!context) throw new Error("canvas indisponível");
      // JPEG has no alpha: a transparent PNG or WebP would turn black without a white base.
      context.fillStyle = color.white;
      context.fillRect(0, 0, size.width, size.height);
      context.drawImage(bitmap, 0, 0, size.width, size.height);
      encoded = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    } finally {
      bitmap.close();
    }
  } catch {
    encoded = null;
  }
  const result = encoded ?? file;
  if (!fitsOnTheWire(result.size)) throw new Error(TOO_BIG);
  return result;
}
const FAILED = "Não deu certo. Tente de novo.";

export const failureText = (error: unknown) => (error instanceof Error && error.message ? error.message : FAILED);

/** What a message with a photo and no words asks. */
export const PHOTO_QUESTION = "O que é isso e onde compro?";

/**
 * Shrinks the photo (and checks it still fits) before anything leaves the browser, then uploads it.
 * Busca por foto (22/11/2026): nothing is read here any more; the photo goes with the next message
 * and the server finds its products in that turn.
 */
export async function attachPhoto(
  sessionId: string,
  file: File,
  onPhoto: (photo: PhotoSummary) => void,
  prepare: (file: File) => Promise<Blob> = prepareFile,
) {
  onPhoto(await api.uploadPhoto(sessionId, await prepare(file)));
}

export const removePhoto = (id: string) => api.deletePhoto(id);

export type PhotoState = ReturnType<typeof usePhoto>;

/** The photo attached to the next message. The single chat passes how to get its session, opened on demand. */
export function usePhoto(sessionId: string | (() => Promise<string>)) {
  const [photo, setPhoto] = useState<PhotoSummary | null>(null);
  const [working, setWorking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (doing: string, action: () => Promise<void>) => {
    setError(null);
    setWorking(doing);
    try {
      await action();
    } catch (failure) {
      setError(failureText(failure));
    } finally {
      setWorking(null);
    }
  }, []);

  return {
    photo,
    working,
    error,
    pick: (file: File) =>
      run("Enviando a foto…", async () => {
        track("photo_attached");
        await attachPhoto(typeof sessionId === "string" ? sessionId : await sessionId(), file, setPhoto);
      }),
    remove: (id: string) =>
      run("Tirando a foto…", async () => {
        await removePhoto(id);
        setPhoto(null);
      }),
    /** The photo went with a message: the composer is free again (the photo stays for its card). */
    sent: () => setPhoto(null),
  };
}

/**
 * The image in what was pasted or dropped on the composer (23/11/2026: pasting a print did nothing).
 * Text copied from a spreadsheet or a document may carry a picture of itself: with words, the words win.
 */
export function imageOf(data: DataTransfer | null): File | null {
  if (!data || data.getData?.("text/plain")?.trim()) return null;
  return [...data.files].find((entry) => entry.type.startsWith("image/")) ?? null;
}

/** The photo that went with a message of the person, drawn above its words. Nothing until it loads. */
export function SentPhotoView(props: { src: string | null }) {
  if (!props.src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a local blob of the person's own photo
    <img
      src={props.src}
      alt="Foto enviada"
      className="block max-h-60 w-auto max-w-full rounded-panel outline outline-1 -outline-offset-1 outline-image-outline"
    />
  );
}

export function SentPhoto(props: { photoId: string }) {
  return <SentPhotoView src={usePhotoBlob(props.photoId)} />;
}

/**
 * The live region of the photo: always in the page, so what it says (sending, a refusal) is
 * announced after it is set. Empty, it takes no room.
 */
export function PhotoStatus(props: { text: string | null; problem?: boolean }) {
  return (
    <p
      role="status"
      className={`text-small font-medium empty:hidden ${props.problem ? "text-alert" : "text-graphite"}`}
    >
      {props.text}
    </p>
  );
}

/** The camera button of the composer; the file input stays hidden and the button opens it. */
export function PhotoPicker(props: { disabled: boolean; onFile: (file: File) => void; className?: string }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/*"
        tabIndex={-1}
        aria-hidden
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) props.onFile(file);
        }}
      />
      <button
        type="button"
        aria-label="Mandar uma foto do produto"
        disabled={props.disabled}
        onClick={() => input.current?.click()}
        className={`press flex shrink-0 items-center justify-center rounded-full text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-50 ${props.className ?? "size-13 bg-surface shadow-raised"}`}
      >
        <CameraIcon className="size-6" />
      </button>
    </>
  );
}

const ghost =
  "press min-h-11 shrink-0 rounded-full px-4 text-ui text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-50";

/** The photo waiting above the composer: what goes with the next message, and where it goes. */
export function PhotoAttachmentView(props: {
  photo: PhotoSummary;
  /** The local address of the image, once loaded. */
  src: string | null;
  working: boolean;
  onRemove: () => void;
}) {
  return (
    <section aria-label="Foto anexada" className="flex items-center gap-3 rounded-panel bg-surface p-3 shadow-raised">
      {props.src ? (
        // eslint-disable-next-line @next/next/no-img-element -- a local blob of the person's own photo
        <img
          src={props.src}
          alt="Sua foto"
          className="size-14 shrink-0 rounded-tag object-cover outline outline-1 -outline-offset-1 outline-image-outline"
        />
      ) : (
        <div aria-hidden className="size-14 shrink-0 rounded-tag bg-sunken" />
      )}
      <p className="min-w-0 flex-1 text-small text-graphite">
        A tone acha os produtos da foto e onde comprar. Recortes vão ao Google Lens; a foto fica só com você e é apagada em{" "}
        {new Date(props.photo.expiresAt).toLocaleDateString("pt-BR", { timeZone: "UTC" })}.
      </p>
      <button type="button" className={ghost} disabled={props.working} onClick={props.onRemove}>
        Tirar
      </button>
    </section>
  );
}

/** The photo attached to the next message, with its status line. */
export function PhotoReference(props: { state: PhotoState; busy: boolean }) {
  const { photo, working, error } = props.state;
  const src = usePhotoBlob(photo?.id);
  return (
    <>
      <PhotoStatus text={error ?? working} problem={Boolean(error)} />
      {photo ? (
        <PhotoAttachmentView
          photo={photo}
          src={src}
          working={Boolean(working) || props.busy}
          onRemove={() => void props.state.remove(photo.id)}
        />
      ) : null}
    </>
  );
}
