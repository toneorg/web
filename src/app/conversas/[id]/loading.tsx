"use client";
// A conversation's address is rendered on the server at each visit; this screen is prefetched with
// the links, so opening one answers at once, with the frame drawn from the last copy kept in memory.
import type { Me } from "@/tone/shared";
import { peek } from "@/conversas/api";
import { Shell } from "@/conversas/Shell";

export default function Loading() {
  return (
    <Shell me={peek<Me>("me") ?? null} current="conversas">
      <main id="conteudo" className="flex flex-col gap-4 py-4" aria-busy="true">
        <p role="status" className="text-small text-graphite">
          Abrindo a conversa…
        </p>
      </main>
    </Shell>
  );
}
