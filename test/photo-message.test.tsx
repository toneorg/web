// 23/11/2026: the photo sent goes with the message, drawn in it (reopened too), a pasted image is
// attached like a picked one, and the live "Na foto" card goes right after the message, as reopened.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Item } from "@/conversas/Conversation";
import { TranscriptItem } from "../src/tone/shared";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => undefined }) }));
vi.mock("posthog-js", () => ({ default: { capture: () => undefined, get_property: () => undefined } }));
const { itemsOf, afterItsMessage } = await import("../src/conversas/Conversation");
const { imageOf, SentPhotoView } = await import("../src/conversas/PhotoReference");

const file = (name: string, type: string) => new File(["x"], name, { type });
const transfer = (files: File[], text = "") => ({ files, getData: () => text }) as unknown as DataTransfer;

describe("foto na mensagem", () => {
  it("a mensagem reaberta traz a foto que foi junto", () => {
    const [line] = TranscriptItem.array().parse([{ kind: "user", text: "O que é isso e onde compro?", photoId: "f1" }]);
    expect(itemsOf(line as TranscriptItem)).toMatchObject([{ kind: "user", photoId: "f1" }]);
  });

  it("desenha a foto da pessoa na mensagem, sem nada enquanto ela não carregou", () => {
    const html = renderToStaticMarkup(<SentPhotoView src="blob:foto" />);
    expect(html).toContain('src="blob:foto"');
    expect(html).toContain('alt="Foto enviada"');
    expect(renderToStaticMarkup(<SentPhotoView src={null} />)).toBe("");
  });

  it("colar uma imagem anexa a imagem; colar texto deixa o texto", () => {
    const photo = file("print.png", "image/png");
    expect(imageOf(transfer([photo]))).toBe(photo);
    expect(imageOf(transfer([file("nota.txt", "text/plain"), photo]))).toBe(photo);
    expect(imageOf(transfer([file("nota.txt", "text/plain")]))).toBeNull();
    // A table copied from a spreadsheet also brings its picture: the words are what was meant.
    expect(imageOf(transfer([photo], "Tênis\tR$ 300"))).toBeNull();
    expect(imageOf(null)).toBeNull();
  });

  it("o cartão Na foto ao vivo entra logo depois da mensagem que trouxe a foto", () => {
    const list = [
      { id: "u0", session: "s", kind: "user", text: "antes" },
      { id: "u1", session: "s", kind: "user", text: "O que é isso?", photoId: "f1" },
      { id: "a1", session: "s", kind: "activity", activity: { startedAt: 0, runs: {} } },
    ] as unknown as Item[];
    const card = { id: "c1", session: "s", kind: "photo_finds", finds: { photoId: "f1", finds: [], at: "" } } as unknown as Item;
    expect(afterItsMessage(list, card).map((item) => item.id)).toEqual(["u0", "u1", "c1", "a1"]);
    // No message of that session in the list: the card goes at the end.
    expect(afterItsMessage([], card).map((item) => item.id)).toEqual(["c1"]);
  });
});
