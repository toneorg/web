"use client";

import Link from "next/link";
import { BrandForm } from "./brand-form";
import { EmailCapture } from "./email-capture";
import { ProfileForm } from "./profile-form";
import { type Audience, useSignup } from "./signup-context";

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
            <span className="press flex min-h-11 items-center rounded-full px-5 text-[0.9375rem] font-medium peer-checked:bg-wine peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-wine">
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
  children,
}: {
  title: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-10 grid grid-cols-1 gap-10 lg:mt-14 lg:grid-cols-12 lg:gap-x-8">
      <div className="lg:col-span-6">
        <h2 className="display-lg">{title}</h2>
        {intro ? <div className="lead mt-6 max-w-[30rem]">{intro}</div> : null}
      </div>
      <div className="lg:col-span-6">{children}</div>
    </div>
  );
}

function Join() {
  return (
    <Frame
      title="Me deixa seu e-mail. Eu aviso quando abrir."
      intro={<p>Eu escrevo quando o beta abrir e de novo no lançamento.</p>}
    >
      <div className="lg:pt-4">
        <EmailCapture placement="fim" />
        <p className="mt-3 ps-5 text-[0.875rem] leading-snug">
          Entrando na lista, você autoriza a tone a te escrever sobre o beta e o lançamento.{" "}
          <Link href="/privacidade" className="underline underline-offset-4">
            Privacidade
          </Link>
        </p>
      </div>
    </Frame>
  );
}

function Joined({ email }: { email: string }) {
  return (
    <Frame
      title="Você está na lista."
      intro={
        <p role="status">
          Eu escrevo para <span className="font-medium break-all">{email}</span> quando o beta
          abrir.
        </p>
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
      intro={
        <p>
          A primeira conversa leva 30 minutos e já vem com uma demonstração montada sobre o seu
          catálogo público.
        </p>
      }
    >
      <Panel>
        <BrandForm />
      </Panel>
    </Frame>
  );
}

export function SignupSection() {
  const { email, audience } = useSignup();
  return (
    <>
      <AudienceSwitch />
      {audience === "marca" ? <Brand /> : email ? <Joined email={email} /> : <Join />}
    </>
  );
}
