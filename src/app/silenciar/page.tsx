import type { Metadata } from "next";
import { MuteLink } from "@/conversas/MuteLink";

// T11: the mute link of a watch e-mail. On the neutral bench, like the conversation pages.
export const metadata: Metadata = {
  title: "Parar e-mails",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function SilenciarPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const token = (await props.searchParams).t;
  return (
    <main className="min-h-dvh bg-paper px-4 py-16 font-sans text-ink">
      <div className="mx-auto flex max-w-lg flex-col gap-6 rounded-card bg-surface p-8 shadow-raised">
        <h1 className="display-sm font-display text-ink">Parar os e-mails deste acompanhamento</h1>
        <MuteLink token={typeof token === "string" && token.length <= 500 ? token : null} />
      </div>
    </main>
  );
}
