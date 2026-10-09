"use client";

import Link from "next/link";
import { buttonClass } from "./button";
import { EmailCapture } from "./email-capture";
import { useSignup } from "./signup-context";

/** The hero's one action: the e-mail field, or what replaces it once she is on the list. */
export function HeroSignup() {
  const { email } = useSignup();

  if (email) {
    return (
      <div role="status" className="flex flex-col items-start gap-4 rounded-3xl bg-white p-6">
        <p className="display-sm">Você está na lista.</p>
        <p className="leading-snug">
          Eu escrevo para <span className="font-medium break-all">{email}</span> quando o beta
          abrir.
        </p>
        <a href="#lista" className={buttonClass()}>
          Quero testar o beta
        </a>
      </div>
    );
  }

  return (
    <>
      <EmailCapture placement="topo" />
      <p className="mt-3 ps-5 text-[0.875rem] leading-snug">
        A tone ainda está em construção. Entrando na lista, você autoriza a gente a te escrever
        sobre o beta e o lançamento.{" "}
        <Link href="/privacidade" className="underline underline-offset-4">
          Privacidade
        </Link>
      </p>
    </>
  );
}
