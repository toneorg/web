// Foto na conversa (busca por foto): o limite de tamanho, o envio, o anexo, o cartão "Na foto" e a exclusão.
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PhotoFinds, PhotoSummary } from "../src/tone/shared";

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
    photoImage: async () => new Blob(),
  },
}));
vi.mock("../src/conversas/analytics", () => ({ track: () => undefined }));
const { PhotoAttachmentView, PhotoStatus, attachPhoto, removePhoto, fitWithin, fitsOnTheWire, prepareFile, MAX_SIDE, MAX_RAW_BYTES } = await import(
  "../src/conversas/PhotoReference"
);
const { PhotoFindsView, cropStyle, findTitle } = await import("../src/conversas/PhotoFinds");
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
const fileOf = (bytes: number) => new File([new Uint8Array(bytes)], "foto.jpg", { type: "image/jpeg" });
const noop = () => undefined;

const finds: PhotoFinds = {
  photoId: "p1",
  at: "2026-11-22T12:00:00.000Z",
  finds: [
    {
      item: 1,
      name: "bota branca de cano curto",
      category: "calçado",
      box: [600, 300, 950, 700],
      identity: "exact",
      brand: "Steve Madden",
      model: "Mackena",
      query: "bota Steve Madden Mackena",
      queryVariants: [],
      visualDescription: "Bota branca de bico fino.",
      matches: [
        { title: "MACKENA White Boot", source: "Steve Madden", link: "https://www.stevemadden.com/products/mackena-white", thumbnail: null, verdict: "same" },
        { title: "Bota branca", source: "Loja", link: "https://loja.com.br/checkout/123", thumbnail: null, verdict: "similar" },
        { title: "Ankle boot branca", source: "Shein", link: "https://br.shein.com/p/1", thumbnail: null, verdict: "similar" },
      ],
    },
    {
      item: 2,
      name: "moletom cropped amarelo",
      category: "roupa",
      box: [100, 300, 400, 700],
      identity: "generic",
      brand: null,
      model: null,
      query: "moletom cropped amarelo",
      queryVariants: [],
      visualDescription: "Moletom amarelo.",
      matches: [],
    },
  ],
};

describe("foto de referência", () => {
  it("shrinks the longest side to 2048 px and never enlarges", () => {
    expect(fitWithin(4032, 3024)).toEqual({ width: MAX_SIDE, height: 1536 });
    expect(fitWithin(3024, 4032)).toEqual({ width: 1536, height: MAX_SIDE });
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });

  it("guards the base64 payload, not the raw file", () => {
    expect(fitsOnTheWire(MAX_RAW_BYTES)).toBe(true);
    expect(fitsOnTheWire(MAX_RAW_BYTES + 10)).toBe(false);
    expect(fitsOnTheWire(6 * 1024 * 1024)).toBe(false);
  });

  it("falls back to the raw file when the browser cannot decode it, under the guard", async () => {
    const small = fileOf(1000);
    expect(await prepareFile(small)).toBe(small);
    await expect(prepareFile(fileOf(MAX_RAW_BYTES + 1024))).rejects.toThrow("A foto é grande demais para enviar.");
  });

  it("refuses a photo still too big after preparing, before uploading", async () => {
    await expect(attachPhoto("s1", fileOf(10), noop, () => Promise.reject(new Error("A foto é grande demais para enviar.")))).rejects.toThrow(
      "A foto é grande demais para enviar.",
    );
    expect(uploadPhoto).not.toHaveBeenCalled();
  });

  it("uploads what was prepared, not the original", async () => {
    uploadPhoto.mockResolvedValue(uploaded);
    const small = new Blob(["x"]);
    await attachPhoto("s1", fileOf(5_000_000), noop, async () => small);
    expect(uploadPhoto).toHaveBeenCalledWith("s1", small);
  });

  it("uploads and hands over the stored photo, without reading it", async () => {
    uploadPhoto.mockResolvedValue(uploaded);
    const seen: PhotoSummary[] = [];
    await attachPhoto("s1", fileOf(1000), (photo) => seen.push(photo), async (f) => f);
    expect(uploadPhoto).toHaveBeenCalledWith("s1", expect.any(File));
    expect(interpretPhoto).not.toHaveBeenCalled();
    expect(seen).toEqual([uploaded]);
  });

  it("the attachment says where the crops go and when the photo is deleted", () => {
    const html = renderToStaticMarkup(<PhotoAttachmentView photo={uploaded} src={null} working={false} onRemove={noop} />);
    expect(html).toContain("Google Lens");
    expect(html).toContain("14/12/2026");
    expect(html).toContain(">Tirar</button>");
  });

  it("415 from server shows its message", async () => {
    uploadPhoto.mockRejectedValue(new ApiError("Só aceito JPEG, PNG ou WebP.", 415));
    const text = await attachPhoto("s1", fileOf(10), noop, async (f) => f).then(
      () => null,
      (error: Error) => error.message,
    );
    const html = renderToStaticMarkup(<PhotoStatus text={text} />);
    expect(html).toContain('role="status"');
    expect(html).toContain("Só aceito JPEG, PNG ou WebP.");
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

describe("cartão Na foto", () => {
  const draw = (props: Partial<Parameters<typeof PhotoFindsView>[0]> = {}) =>
    renderToStaticMarkup(<PhotoFindsView finds={finds} src={null} size={null} busy={false} onSearch={noop} {...props} />);

  it("lists each product with how sure the tone is and the pages it checked", () => {
    const html = draw();
    expect(html).toContain("Achei 2 produtos.");
    expect(html).toContain("Steve Madden Mackena");
    expect(html).toContain("Achei o modelo");
    expect(html).toContain("Parecidos");
    expect(html).toContain('href="https://www.stevemadden.com/products/mackena-white"');
    expect(html).toMatch(/rel="noopener noreferrer nofollow"/);
    expect(html).toContain("A busca por imagem não achou este produto em lojas.");
    expect(html.match(/Buscar nas lojas/g)).toHaveLength(2);
  });

  it("never links a checkout page", () => {
    expect(draw()).not.toContain("/checkout/");
  });

  it("waits while the conversation is busy", () => {
    expect(draw({ busy: true })).toMatch(/<button[^>]*disabled=""[^>]*>Buscar nas lojas/);
  });

  it("the crop fills its square without stretching the photo", () => {
    // A 1000×500 photo; the box is 200×200 px around (500, 250).
    const style = cropStyle([400, 400, 600, 600], { width: 1000, height: 500 });
    const side = 220;
    expect(parseFloat(style.width)).toBeCloseTo((1000 / side) * 100);
    expect(parseFloat(style.height)).toBeCloseTo((500 / side) * 100);
    expect(parseFloat(style.left)).toBeCloseTo((-(500 - side / 2) / side) * 100);
  });

  it("names the product by brand and model only when it is exact", () => {
    expect(findTitle(finds.finds[0] as PhotoFinds["finds"][number])).toBe("Steve Madden Mackena");
    expect(findTitle(finds.finds[1] as PhotoFinds["finds"][number])).toBe("Moletom cropped amarelo");
  });
});
