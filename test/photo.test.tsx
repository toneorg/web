// Foto de referência na conversa: o limite de 4 MB, o envio, a leitura e a exclusão.
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PhotoSummary } from "../src/tone/shared";

const uploadPhoto = vi.fn();
const interpretPhoto = vi.fn();
const deletePhoto = vi.fn();
vi.mock("../src/conversas/api", () => ({
  ApiError: class ApiError extends Error {
    constructor(
      message: string,
      readonly status: number,
    ) {
      super(message);
    }
  },
  api: {
    uploadPhoto: (...args: unknown[]) => uploadPhoto(...args),
    interpretPhoto: (...args: unknown[]) => interpretPhoto(...args),
    deletePhoto: (...args: unknown[]) => deletePhoto(...args),
  },
}));
const { PhotoCardView, PhotoStatus, attachPhoto, removePhoto, MAX_PHOTO_BYTES } = await import(
  "../src/conversas/PhotoReference"
);
const { ApiError } = await import("../src/conversas/api");

afterEach(() => {
  uploadPhoto.mockReset();
  interpretPhoto.mockReset();
  deletePhoto.mockReset();
});

const uploaded: PhotoSummary = {
  id: "p1",
  sessionId: "s1",
  mime: "image/jpeg",
  width: 10,
  height: 10,
  createdAt: "2026-11-14T12:00:00.000Z",
  expiresAt: "2026-12-14T12:00:00.000Z",
  status: "uploaded",
  interpretation: null,
  correction: null,
};
const read: PhotoSummary = {
  ...uploaded,
  status: "interpreted",
  interpretation: {
    category: "Tênis",
    query: "tênis branco",
    attributes: [{ key: "cor", label: "Cor", value: "Branco", certainty: "high" }],
    doubts: ["Material"],
  },
};
const fileOf = (bytes: number) => new File([new Uint8Array(bytes)], "foto.jpg", { type: "image/jpeg" });
const noop = () => undefined;
const draw = (photo: PhotoSummary, props: Partial<Parameters<typeof PhotoCardView>[0]> = {}) =>
  renderToStaticMarkup(
    <PhotoCardView
      photo={photo}
      src={null}
      draft={[{ key: "cor", label: "Cor", value: "Branco", priority: "preferred" }]}
      working={false}
      onDraft={noop}
      onInterpret={noop}
      onConfirm={noop}
      onSearch={noop}
      onDelete={noop}
      {...props}
    />,
  );

describe("foto de referência", () => {
  it("rejects a file over 4 MB before uploading", async () => {
    await expect(attachPhoto("s1", fileOf(MAX_PHOTO_BYTES + 512 * 1024), noop)).rejects.toThrow(
      "A foto passa de 4 MB.",
    );
    expect(uploadPhoto).not.toHaveBeenCalled();
  });

  it("uploads, interprets and shows the reading", async () => {
    uploadPhoto.mockResolvedValue(uploaded);
    interpretPhoto.mockResolvedValue(read);
    const seen: PhotoSummary[] = [];
    await attachPhoto("s1", fileOf(1000), (photo) => seen.push(photo));
    expect(uploadPhoto).toHaveBeenCalledWith("s1", expect.any(File));
    expect(interpretPhoto).toHaveBeenCalledWith("p1");
    expect(seen.map((photo) => photo.status)).toEqual(["uploaded", "interpreted"]);
    const html = draw(read);
    expect(html).toContain("Parece: Tênis");
    expect(html).toContain("Branco");
    expect(html).toContain("A foto não mostra: Material");
    expect(html).toContain("Só você vê esta foto");
    expect(html).toContain("14/12/2026");
    expect(html).toMatch(/<button[^>]*disabled[^>]*>Buscar parecidos/);
  });

  it("keeps the uploaded photo when the reading fails", async () => {
    uploadPhoto.mockResolvedValue(uploaded);
    interpretPhoto.mockRejectedValue(new ApiError("O saldo dos últimos sete dias não cobre a leitura da foto.", 429));
    const seen: PhotoSummary[] = [];
    await expect(attachPhoto("s1", fileOf(1000), (photo) => seen.push(photo))).rejects.toThrow("saldo");
    expect(seen).toHaveLength(1);
    expect(draw(uploaded)).toContain("Ler a foto");
  });

  it("415 from server shows its message", async () => {
    uploadPhoto.mockRejectedValue(new ApiError("Só aceito JPEG, PNG ou WebP.", 415));
    const text = await attachPhoto("s1", fileOf(10), noop).then(
      () => null,
      (error: Error) => error.message,
    );
    const html = renderToStaticMarkup(<PhotoStatus text={text} />);
    expect(html).toContain('role="status"');
    expect(html).toContain("Só aceito JPEG, PNG ou WebP.");
    expect(interpretPhoto).not.toHaveBeenCalled();
  });

  it("delete removes the photo", async () => {
    deletePhoto.mockResolvedValue({ ok: true });
    await removePhoto("p1");
    expect(deletePhoto).toHaveBeenCalledWith("p1");
  });

  it("keeps the status region mounted and empty", () => {
    expect(renderToStaticMarkup(<PhotoStatus text={null} />)).toMatch(/<p[^>]*role="status"[^>]*><\/p>/);
  });
});
