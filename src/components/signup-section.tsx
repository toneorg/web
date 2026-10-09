"use client";

import { useEffect, useRef } from "react";
import { BrandForm } from "./brand-form";
import { EmailCapture } from "./email-capture";
import { PEER_FOCUS } from "./form-parts";
import { ProfileForm } from "./profile-form";
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
              className={`press flex min-h-11 items-center rounded-full px-5 text-[0.9375rem] font-medium peer-checked:bg-wine peer-checked:text-white ${PEER_FOCUS}`}
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
  return <div className="rounded-4xl bg-white p-6 sm:p-10">{children}</div>;
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

function Join() {
  return (
    <Frame
      title="Me deixa seu e-mail. Eu aviso quando abrir."
      intro="Eu escrevo quando o beta abrir e de novo no lançamento."
    >
      <div className="lg:pt-4">
        <EmailCapture placement="fim" />
      </div>
    </Frame>
  );
}

function Joined({ email, takeFocus }: { email: string; takeFocus: boolean }) {
  return (
    <Frame
      title="Você está na lista."
      takeFocus={takeFocus}
      intro={
        <>
          Eu escrevo para <span className="break-all font-medium">{email}</span> quando o beta
          abrir.
        </>
      }
    >
      <Panel>
        <h3 className="display-md">Quer testar antes de todo mundo?</h3>
        <p className="mt-4 max-w-[34rem] leading-relaxed text-muted">
          O beta precisa de pessoas de todas as faixas de tom. Estas respostas ajudam a montar o
          grupo, e nenhuma é obrigatória.
        </p>
        <div className="mt-10">
          <ProfileForm email={email} />
        </div>
      </Panel>
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
  return (
    <>
      <AudienceSwitch />
      <div hidden={audience !== "pessoa"}>
        {email ? <Joined email={email} takeFocus={joinedAt === "fim"} /> : <Join />}
      </div>
      <div hidden={audience !== "marca"}>
        <Brand />
      </div>
    </>
  );
}
