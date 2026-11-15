"use client";
// The person's reference photo in the conversation. The photo is shrunk and re-encoded in the
// browser first (hosting caps a request body near 4.5 MB and base64 adds a third), then goes to the
// server as base64; the image comes back from
// photos/:id/image into a local blob: it never gets a public address. The person keeps, rewrites
// or ignores each attribute the tone read before the search.
import { useCallback, useEffect, useRef, useState } from "react";
import { color } from "@toneorg/design";
import { CameraIcon } from "@/components/icons";
import type { PhotoCorrection, PhotoSummary } from "@/tone/shared";
import { api } from "./api";

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

type Attributes = PhotoCorrection["attributes"];
type Priority = Attributes[number]["priority"];
const PRIORITY: Record<Priority, string> = {
  required: "Precisa ter",
  preferred: "Prefiro",
  indifferent: "Tanto faz",
};

export const failureText = (error: unknown) => (error instanceof Error && error.message ? error.message : FAILED);

/**
 * Shrinks the photo (and checks it still fits) before anything leaves the browser, uploads, then asks for the reading. The photo
 * is handed to `onPhoto` as soon as it is stored, so a failed reading still leaves "Ler a foto".
 */
export async function attachPhoto(
  sessionId: string,
  file: File,
  onPhoto: (photo: PhotoSummary) => void,
  prepare: (file: File) => Promise<Blob> = prepareFile,
) {
  const stored = await api.uploadPhoto(sessionId, await prepare(file));
  onPhoto(stored);
  onPhoto(await api.interpretPhoto(stored.id));
}

export const removePhoto = (id: string) => api.deletePhoto(id);

/** Whether the draft is what the server has kept: only then the search compares what the person sees. */
export function draftIsSaved(photo: PhotoSummary, draft: Attributes): boolean {
  const saved = photo.correction?.attributes;
  return (
    Boolean(saved) &&
    saved?.length === draft.length &&
    draft.every((entry, at) => {
      const kept = saved?.[at];
      return kept?.key === entry.key && kept.value === entry.value && kept.priority === entry.priority;
    })
  );
}

/** What the attributes start as: the person's correction, or else the reading. */
export function draftOf(photo: PhotoSummary): Attributes {
  const source = photo.correction?.attributes ?? photo.interpretation?.attributes ?? [];
  return source.map((attribute) => ({
    key: attribute.key,
    label: attribute.label,
    value: attribute.value,
    priority: "priority" in attribute ? attribute.priority : "preferred",
  }));
}

export type PhotoState = ReturnType<typeof usePhoto>;

/** The photo of one conversation and what is happening to it. The single chat passes how to get its session, opened on demand. */
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
      run("Enviando e lendo a foto…", async () =>
        attachPhoto(typeof sessionId === "string" ? sessionId : await sessionId(), file, setPhoto),
      ),
    interpret: (id: string) => run("Lendo a foto…", async () => setPhoto(await api.interpretPhoto(id))),
    correct: (id: string, correction: PhotoCorrection) =>
      run("Guardando os atributos…", async () => setPhoto(await api.correctPhoto(id, correction))),
    remove: (id: string) =>
      run("Apagando a foto…", async () => {
        await removePhoto(id);
        setPhoto(null);
      }),
  };
}

const quiet =
  "press min-h-11 rounded-full bg-surface px-4 text-ui text-ink shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-50";
const solid =
  "press min-h-11 rounded-full bg-ink px-4 text-ui text-on-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:bg-rule disabled:text-graphite";
const ghost =
  "press min-h-11 rounded-full px-4 text-ui text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-50";

/**
 * The live region of the photo: always in the page, so what it says (sending, reading, a refusal)
 * is announced after it is set. Empty, it takes no room.
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
        aria-label="Enviar foto de referência"
        disabled={props.disabled}
        onClick={() => input.current?.click()}
        className={`press flex shrink-0 items-center justify-center rounded-full text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-50 ${props.className ?? "size-13 bg-surface shadow-raised"}`}
      >
        <CameraIcon className="size-6" />
      </button>
    </>
  );
}

export function PhotoCardView(props: {
  photo: PhotoSummary;
  /** The local address of the image, once loaded. */
  src: string | null;
  draft: Attributes;
  working: boolean;
  onDraft: (draft: Attributes) => void;
  onInterpret: () => void;
  onConfirm: () => void;
  onSearch: () => void;
  onDelete: () => void;
}) {
  const { photo, draft } = props;
  const change = (index: number, patch: Partial<Attributes[number]>) =>
    props.onDraft(draft.map((entry, at) => (at === index ? { ...entry, ...patch } : entry)));
  return (
    <section aria-label="Foto de referência" className="flex flex-col gap-3 rounded-card bg-surface p-4 shadow-raised">
      <div className="flex items-start gap-3">
        {props.src ? (
          // eslint-disable-next-line @next/next/no-img-element -- a local blob of the person's own photo
          <img src={props.src} alt="Sua foto de referência" className="size-16 shrink-0 rounded-thumb object-cover outline outline-1 -outline-offset-1 outline-image-outline" />
        ) : (
          <div aria-hidden className="size-16 shrink-0 rounded-thumb bg-sunken" />
        )}
        <p className="text-small text-graphite">
          Só você vê esta foto. Ela é lida por um provedor de modelo de visão e apagada aqui em{" "}
          {new Date(photo.expiresAt).toLocaleDateString("pt-BR", { timeZone: "UTC" })}; cópias do provedor seguem as
          regras dele.
        </p>
      </div>
      {photo.status === "failed" ? (
        <p className="text-small font-medium text-alert">
          Não consegui ler a foto. Descreva o que procura em texto, ou tente ler de novo.
        </p>
      ) : null}
      {photo.status !== "interpreted" ? (
        <button type="button" className={solid} disabled={props.working} onClick={props.onInterpret}>
          Ler a foto
        </button>
      ) : null}
      {photo.interpretation ? (
        <>
          <p className="text-small text-graphite">
            Parece: {photo.interpretation.category}. Ajuste o que importa; atributos marcados “Tanto faz” não entram na
            comparação.
          </p>
          <ul className="flex flex-col gap-3">
            {draft.map((attribute, index) => (
              <li key={attribute.key} className="flex flex-col gap-1">
                <label htmlFor={`attr-${photo.id}-${attribute.key}`} className="text-ui text-ink">
                  {attribute.label}
                </label>
                <div className="flex gap-2">
                  <input
                    id={`attr-${photo.id}-${attribute.key}`}
                    value={attribute.value}
                    maxLength={80}
                    onChange={(event) => change(index, { value: event.target.value })}
                    className="min-h-13 min-w-0 flex-1 rounded-input bg-surface px-4 text-body text-ink outline outline-1 -outline-offset-1 outline-rule focus-visible:outline-2 focus-visible:outline-ink"
                  />
                  <select
                    aria-label={`Peso de ${attribute.label}`}
                    value={attribute.priority}
                    onChange={(event) => change(index, { priority: event.target.value as Priority })}
                    className="min-h-13 rounded-input bg-surface px-3 text-body text-ink outline outline-1 -outline-offset-1 outline-rule focus-visible:outline-2 focus-visible:outline-ink"
                  >
                    {Object.entries(PRIORITY).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </li>
            ))}
          </ul>
          {photo.interpretation.doubts.length ? (
            <p className="text-small text-graphite">A foto não mostra: {photo.interpretation.doubts.join("; ")}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={quiet}
              disabled={props.working || draft.length === 0 || draft.some((entry) => !entry.value.trim())}
              onClick={props.onConfirm}
            >
              Confirmar atributos
            </button>
            <button type="button" className={solid} disabled={props.working || !draftIsSaved(photo, draft)} onClick={props.onSearch}>
              Buscar parecidos
            </button>
          </div>
        </>
      ) : null}
      <button type="button" className={`${ghost} self-start`} disabled={props.working} onClick={props.onDelete}>
        Apagar foto
      </button>
    </section>
  );
}

/** The photo of the conversation: loads its image and holds what the person is rewriting. */
export function PhotoReference(props: { state: PhotoState; busy: boolean; onSearch: (photo: PhotoSummary) => void }) {
  const { photo, working, error } = props.state;
  const [src, setSrc] = useState<string | null>(null);
  const [draft, setDraft] = useState<Attributes>([]);
  const id = photo?.id;

  useEffect(() => {
    if (!id) return;
    let url: string | null = null;
    let live = true;
    api
      .photoImage(id)
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
  }, [id]);

  // A new answer from the server (read, corrected) starts the draft over; typing does not.
  const [seen, setSeen] = useState(photo);
  if (seen !== photo) {
    setSeen(photo);
    setDraft(photo ? draftOf(photo) : []);
  }

  return (
    <>
      <PhotoStatus text={error ?? working} problem={Boolean(error)} />
      {photo ? (
        <PhotoCardView
          photo={photo}
          src={src}
          draft={draft}
          working={Boolean(working) || props.busy}
          onDraft={setDraft}
          onInterpret={() => void props.state.interpret(photo.id)}
          onConfirm={() => void props.state.correct(photo.id, { attributes: draft })}
          onSearch={() => props.onSearch(photo)}
          onDelete={() => void props.state.remove(photo.id)}
        />
      ) : null}
    </>
  );
}
