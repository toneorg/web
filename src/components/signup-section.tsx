"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SIGN_IN_PATH } from "@/lib/site";
import { BrandForm } from "./brand-form";
import { EmailCapture } from "./email-capture";
import { PEER_FOCUS } from "./form-parts";
import { type Audience, useSignup } from "./signup-context";
import { GRID } from "./site-chrome";

const AUDIENCES: { value: Audience; label: string }[] = [
  { value: "pessoa", label: "Para mim" },
  { value: "marca", label: "Para a minha marca" },
];

function AudienceSwitch() {
  const { audience, setAudience } = useSignup();
  return (
    <fieldset>
      <legend className="sr-only">Para quem é o cadastro</legend>
      <div className="inline-flex gap-1 rounded-full bg-wine/10 p-1">
        {AUDIENCES.map((option) => (
          <label key={option.value} className="cursor-pointer">
            <input
              type="radio"
              name="audience"
              value={option.value}
              checked={audience === option.value}
              onChange={() => setAudience(option.value)}
              className="peer sr-only"
            />
            <span
              className={`press flex min-h-11 items-center rounded-full px-5 text-ui peer-checked:bg-wine peer-checked:text-white ${PEER_FOCUS}`}
            >
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-tile bg-white p-6 sm:p-10">{children}</div>;
}

/** The two-column frame every state of the section shares. */
function Frame({
  title,
  intro,
  takeFocus,
  children,
}: {
  title: string;
  intro: string | React.ReactNode;
  /** Moves keyboard focus to the title when this state replaces the field she just used. */
  takeFocus?: boolean;
  children: React.ReactNode;
}) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (takeFocus) titleRef.current?.focus();
  }, [takeFocus]);

  return (
    <div className={`${GRID} mt-10 gap-10 lg:mt-14`}>
      <div className="lg:col-span-6">
        <h2 ref={titleRef} tabIndex={-1} className="display-lg focus:outline-none">
          {title}
        </h2>
        <p className="lead mt-6 max-w-[30rem]">{intro}</p>
      </div>
      <div className="lg:col-span-6">{children}</div>
    </div>
  );
}

/** For whoever reached the end of the page with an account already. */
function SignInLine() {
  return (
    <p className="mt-6 ps-5 text-ui font-normal">
      Já tem conta?{" "}
      <Link href={SIGN_IN_PATH} className="font-medium underline underline-offset-4">
        Entrar
      </Link>
    </p>
  );
}

function Join() {
  return (
    <Frame
      title="Me deixa seu e-mail. Eu aviso quando tiver vaga."
      intro="Os convites saem aos poucos, na ordem da lista. Eu escrevo quando chegar a sua vez e de novo no lançamento."
    >
      <div className="lg:pt-4">
        <EmailCapture placement="fim" />
        <SignInLine />
      </div>
    </Frame>
  );
}

// How an invited person gets in, per toneorg/extension README and docs/semana-de-teste.md.
const INVITE_STEPS = [
  "Você recebe um código de convite e a extensão para o Chrome.",
  "Instala a extensão no computador e entra com o código.",
  "Numa primeira conversa de dois ou três minutos, eu aprendo do que você gosta.",
];

function Joined({ email, takeFocus }: { email: string; takeFocus: boolean }) {
  return (
    <Frame
      title="Você está na lista."
      takeFocus={takeFocus}
      intro={
        <>
          Eu escrevo para <span className="break-all font-medium">{email}</span> quando chegar a
          sua vez.
        </>
      }
    >
      <Panel>
        <h3 className="display-md">Quando o convite chegar</h3>
        <ol className="mt-6 flex flex-col gap-4 leading-relaxed">
          {INVITE_STEPS.map((step, i) => (
            <li key={step} className="flex gap-4">
              <span className="display-sm w-5 shrink-0 tabular-nums">{i + 1}</span>
              <span className="pt-1">{step}</span>
            </li>
          ))}
        </ol>
      </Panel>
      <SignInLine />
    </Frame>
  );
}

function Brand() {
  return (
    <Frame
      title="Vamos conversar sobre a sua marca."
      intro="A primeira conversa leva 30 minutos e já vem com uma demonstração montada sobre o seu catálogo público."
    >
      <Panel>
        <BrandForm />
      </Panel>
    </Frame>
  );
}

/**
 * Both sides stay mounted and the one not chosen is hidden, so switching
 * between them (or tapping the nav's button mid-form) never erases what was
 * typed.
 */
export function SignupSection() {
  const { email, audience, joinedAt } = useSignup();
  // The brand pilot is no longer pitched on the page: only /marcas links open it,
  // and once open the switch stays, so the way back to "Para mim" does not vanish.
  const [brandSeen, setBrandSeen] = useState(false);
  if (audience === "marca" && !brandSeen) setBrandSeen(true);
  return (
    <>
      {brandSeen ? <AudienceSwitch /> : null}
      <div hidden={audience !== "pessoa"}>
        {email ? <Joined email={email} takeFocus={joinedAt === "fim"} /> : <Join />}
      </div>
      <div hidden={audience !== "marca"}>
        <Brand />
      </div>
    </>
  );
}
