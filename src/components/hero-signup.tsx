"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { SIGN_IN_PATH } from "@/lib/site";
import { buttonClass } from "./button";
import { EmailCapture } from "./email-capture";
import { useSignup } from "./signup-context";

/** Replaces the hero's field once she is on the list. */
function Joined({ email, takeFocus }: { email: string; takeFocus: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  // The field she just used is gone, so keyboard focus moves to what replaced it.
  useEffect(() => {
    if (takeFocus) ref.current?.focus();
  }, [takeFocus]);

  return (
    <div
      ref={ref}
      tabIndex={-1}
      className="flex flex-col items-start gap-4 rounded-tile bg-white p-6 focus:outline-none"
    >
      <p className="display-sm">Você está na lista.</p>
      <p className="leading-snug">
        Eu escrevo para <span className="break-all font-medium">{email}</span> quando chegar a
        sua vez.
      </p>
      <Link href={SIGN_IN_PATH} className={buttonClass({ variant: "quiet" })}>
        Já tenho conta
      </Link>
    </div>
  );
}

/** The hero's one action: the e-mail field, or what replaces it once she is on the list. */
export function HeroSignup() {
  const { email, joinedAt } = useSignup();

  if (email) return <Joined email={email} takeFocus={joinedAt === "topo"} />;
  return <EmailCapture placement="topo" lead="A tone está em teste fechado." />;
}
