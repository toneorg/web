"use client";
// T05/T06: entering the web with the account's e-mail and password. The first
// time, the invite code (made for one e-mail) opens the onboarding: name,
// password and the consent. A forgotten password goes by e-mail: the link
// (?redefinir=TOKEN) opens the step that sets a new one.
import { type FormEvent, useEffect, useState } from "react";
import { type InviteInfo, PASSWORD_MIN } from "@/tone/shared";
import { track } from "./analytics";
import { ApiError, api } from "./api";

const field =
  "min-h-13 w-full rounded-input border border-rule bg-surface px-4 text-body text-ink focus-visible:outline-2 focus-visible:outline-ink aria-invalid:outline-2 aria-invalid:outline-alert read-only:bg-sunken read-only:text-graphite";
const primary =
  "min-h-13 rounded-full bg-ink px-7 text-ui text-on-ink disabled:bg-rule disabled:text-graphite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const quiet =
  "min-h-11 self-start rounded-full px-4 text-ui text-ink underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ink";
const label = "text-body font-medium text-ink";

/** What the test collects and why. */
const CONSENT = [
  "As conversas comigo, suas respostas e o que aprendo sobre seus gostos e medidas.",
  "As páginas de loja que eu leio para pesquisar produtos e preços.",
  "Se você conectar: e-mails de confirmação de pedido (Gmail) e eventos da agenda, só para entender suas compras.",
  "Na web, como você usa as telas: cliques, erros e uma gravação da tela com o texto que você digita e as conversas mascarados.",
  "Serve só para testar o produto, e só a equipe da tone que conduz o teste vê.",
  "Os textos são processados por provedores de modelos de IA (OpenRouter e TypeSafe) para gerar as respostas.",
  "Eu nunca pago nem finalizo uma compra. Você vê, corrige e apaga tudo em “Você”, quando quiser.",
];

type Step = "signin" | "invite" | "onboarding" | "forgot" | "sent" | "reset";

const TITLES: Record<Step, string> = {
  signin: "Entrar na tone",
  invite: "Entrar com o convite",
  onboarding: "Criar a sua conta",
  forgot: "Esqueci minha senha",
  sent: "Confira seu e-mail",
  reset: "Crie uma senha nova",
};

/** The invite code in the address (?convite=CODE), from the invite e-mail's link; empty when there is none. */
function linkedInvite(): string {
  if (typeof window === "undefined") return "";
  const code = new URLSearchParams(window.location.search).get("convite")?.trim().toUpperCase() ?? "";
  return /^[A-Z0-9]{4,16}$/.test(code) ? code : "";
}

/** The reset token in the address (?redefinir=TOKEN), from the reset e-mail's link; empty when there is none. */
export function linkedReset(): string {
  if (typeof window === "undefined") return "";
  const token = new URLSearchParams(window.location.search).get("redefinir")?.trim() ?? "";
  return /^[\w-]{20,200}$/.test(token) ? token : "";
}

/** Takes the reset token out of the address once it is spent or refused, so a reload or a shared link carries nothing. */
function dropResetFromAddress() {
  const url = new URL(window.location.href);
  url.searchParams.delete("redefinir");
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

export function SignIn(props: {
  onDone: () => void;
  expired?: boolean;
  /** Inside another page (the home page): a section with a smaller title, not the page's main. */
  embedded?: boolean;
}) {
  // The invite e-mail links here with ?convite=CODE. SignIn renders only after the client checked the
  // session, never on the server, so reading the address while starting the state is safe.
  const [linked] = useState(linkedInvite);
  const [resetToken] = useState(linkedReset);
  const [step, setStep] = useState<Step>(resetToken ? "reset" : linked ? "invite" : "signin");
  /** The e-mail the reset link is for; null while the link is being checked. */
  const [resetEmail, setResetEmail] = useState<string | null>(null);
  const [code, setCode] = useState(linked);
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (linked && !resetToken) track("invite_link_opened");
  }, [linked, resetToken]);

  // The reset link: check it before showing the form, so an expired one says so at once.
  useEffect(() => {
    if (!resetToken) return;
    track("password_reset_link_opened");
    let live = true;
    api
      .checkReset(resetToken)
      .then((info) => {
        if (live) setResetEmail(info.email);
      })
      .catch((failure: unknown) => {
        if (!live) return;
        dropResetFromAddress();
        setStep("forgot");
        setError(
          failure instanceof ApiError && failure.status !== 403
            ? failure.message
            : "Este link expirou ou já foi usado. Digite seu e-mail para receber um novo.",
        );
      });
    return () => {
      live = false;
    };
  }, [resetToken]);

  const go = (next: Step) => {
    if (resetToken && next !== "reset") dropResetFromAddress();
    setStep(next);
    setError(null);
    setPassword("");
    setConfirmation("");
  };
  const run = async (event: FormEvent, action: () => Promise<unknown>) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await action();
    } catch (failure) {
      track("sign_in_failed", {
        step,
        status: failure instanceof ApiError ? failure.status : null,
        reason: failure instanceof ApiError ? "api" : "validation",
      });
      setError(failure instanceof ApiError || failure instanceof Error ? failure.message : "Não deu certo. Tente de novo.");
    } finally {
      setBusy(false);
    }
  };
  const invalid = error ? true : undefined;
  const described = error ? "signin-error" : undefined;

  const Frame = props.embedded ? "section" : "main";
  const Title = props.embedded ? "h2" : "h1";
  return (
    <Frame
      id={props.embedded ? "entrar" : "conteudo"}
      aria-labelledby="entrar-titulo"
      className={props.embedded ? "flex w-full flex-col gap-6" : "mx-auto flex w-full max-w-md flex-col gap-6 px-5 py-12"}
    >
      <Title id="entrar-titulo" className="display-sm font-display text-ink">
        {step === "onboarding" && invite?.existing ? "Defina a sua senha" : TITLES[step]}
      </Title>
      {props.expired && step === "signin" ? (
        <p role="status" className="text-small text-ink">
          Sua sessão na web terminou. Entre de novo para continuar suas conversas.
        </p>
      ) : null}

      {step === "signin" ? (
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) =>
            void run(event, async () => {
              await api.signIn(email, password);
              track("sign_in_completed", { method: "password" });
              props.onDone();
            })
          }
        >
          <label htmlFor="email" className={label}>
            E-mail
          </label>
          <input id="email" type="email" className={field} autoComplete="email" value={email} aria-invalid={invalid} aria-describedby={described} onChange={(event) => setEmail(event.target.value)} />
          <label htmlFor="senha" className={label}>
            Senha
          </label>
          <input id="senha" type="password" className={field} autoComplete="current-password" value={password} aria-invalid={invalid} aria-describedby={described} onChange={(event) => setPassword(event.target.value)} />
          <button type="submit" className={primary} disabled={busy || !email.includes("@") || !password}>
            {busy ? "Entrando…" : "Entrar"}
          </button>
          <button type="button" className={quiet} onClick={() => go("forgot")}>
            Esqueci minha senha
          </button>
        </form>
      ) : step === "forgot" ? (
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) =>
            void run(event, async () => {
              await api.forgotPassword(email.trim());
              track("password_reset_requested");
              go("sent");
            })
          }
        >
          <p id="esqueci-dica" className="text-ui text-graphite">
            Enviamos um link para o e-mail da sua conta. Por ele, você cria uma senha nova.
          </p>
          <label htmlFor="email-esqueci" className={label}>
            E-mail
          </label>
          <input
            id="email-esqueci"
            type="email"
            className={field}
            autoComplete="email"
            value={email}
            aria-invalid={invalid}
            aria-describedby={described ?? "esqueci-dica"}
            onChange={(event) => setEmail(event.target.value)}
          />
          <button type="submit" className={primary} disabled={busy || !email.includes("@")}>
            {busy ? "Enviando…" : "Enviar link"}
          </button>
        </form>
      ) : step === "sent" ? (
        <div className="flex flex-col gap-3">
          <p role="status" className="text-body text-ink">
            Se existir uma conta com <span className="font-medium break-all">{email.trim()}</span>, o link para criar uma
            senha nova chega em instantes.
          </p>
          <p className="text-ui text-graphite">O link vale por uma hora e serve uma vez. Se não chegar, confira o spam.</p>
          <button type="button" className={quiet} onClick={() => go("forgot")}>
            Enviar de novo
          </button>
        </div>
      ) : step === "reset" ? (
        resetEmail === null ? (
          <p role="status" className="text-ui text-graphite">
            Conferindo o link…
          </p>
        ) : (
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) =>
              void run(event, async () => {
                if (password.length < PASSWORD_MIN) throw new Error(`A senha precisa de ${PASSWORD_MIN} caracteres ou mais.`);
                if (password !== confirmation) throw new Error("As duas senhas não são iguais.");
                await api.resetPassword(resetToken, password);
                track("password_reset_completed");
                track("sign_in_completed", { method: "password_reset" });
                dropResetFromAddress();
                props.onDone();
              })
            }
          >
            <p className="text-ui text-graphite">
              Para a conta <span className="font-medium text-ink break-all">{resetEmail}</span>. Ao salvar, quem estiver
              com a conta aberta em outro aparelho precisa entrar de novo.
            </p>
            {/* Lets the password manager save the new password under the right account. */}
            <input type="email" className="sr-only" autoComplete="username" value={resetEmail} readOnly tabIndex={-1} aria-hidden />
            <label htmlFor="senha-nova" className={label}>
              Senha nova
            </label>
            <input
              id="senha-nova"
              type="password"
              className={field}
              autoComplete="new-password"
              value={password}
              aria-invalid={invalid}
              aria-describedby={described ? `${described} senha-nova-dica` : "senha-nova-dica"}
              onChange={(event) => setPassword(event.target.value)}
            />
            <p id="senha-nova-dica" className="text-small text-graphite">
              {PASSWORD_MIN} caracteres ou mais.
            </p>
            <label htmlFor="repetir-senha-nova" className={label}>
              Repita a senha
            </label>
            <input
              id="repetir-senha-nova"
              type="password"
              className={field}
              autoComplete="new-password"
              value={confirmation}
              aria-invalid={invalid}
              aria-describedby={described}
              onChange={(event) => setConfirmation(event.target.value)}
            />
            <button type="submit" className={primary} disabled={busy || !password || !confirmation}>
              {busy ? "Salvando…" : "Salvar senha e entrar"}
            </button>
          </form>
        )
      ) : step === "invite" ? (
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) =>
            void run(event, async () => {
              const info = await api.invite(code);
              track("invite_checked", { existing_account: Boolean(info.existing) });
              setInvite(info);
              if (info.email) setEmail(info.email);
              go("onboarding");
            })
          }
        >
          <label htmlFor="convite" className={label}>
            Código do convite
          </label>
          <p id="convite-dica" className="text-ui text-graphite">
            O convite vale para o e-mail que o recebeu e serve uma vez, para criar a sua conta.
          </p>
          <input id="convite" className={field} autoComplete="off" value={code} aria-invalid={invalid} aria-describedby={described ?? "convite-dica"} onChange={(event) => setCode(event.target.value.toUpperCase())} />
          <button type="submit" className={primary} disabled={busy || code.trim().length < 4}>
            {busy ? "Conferindo…" : "Continuar"}
          </button>
        </form>
      ) : (
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) =>
            void run(event, async () => {
              if (password.length < PASSWORD_MIN) throw new Error(`A senha precisa de ${PASSWORD_MIN} caracteres ou mais.`);
              if (password !== confirmation) throw new Error("As duas senhas não são iguais.");
              if (!consent) throw new Error("Para testar, é preciso aceitar o termo.");
              // An existing account keeps its name; the field only has to be filled.
              await api.redeem(code, invite?.existing ? "-" : name, email, password);
              track("sign_in_completed", { method: "invite", existing_account: Boolean(invite?.existing) });
              props.onDone();
            })
          }
        >
          <p className="text-ui text-graphite">
            {invite?.existing
              ? "Esta conta já existe e ainda não tem senha. Depois de hoje, você entra com o e-mail e esta senha."
              : "Depois de hoje, você entra com o e-mail e a senha que definir aqui."}
          </p>
          {invite?.existing ? null : (
            <>
              <label htmlFor="nome" className={label}>
                Seu nome
              </label>
              <input id="nome" className={field} autoComplete="given-name" value={name} onChange={(event) => setName(event.target.value)} />
            </>
          )}
          <label htmlFor="email-convite" className={label}>
            Seu e-mail
          </label>
          <input
            id="email-convite"
            type="email"
            className={field}
            autoComplete="email"
            value={email}
            readOnly={Boolean(invite?.email)}
            aria-describedby={invite?.email ? "email-convite-dica" : undefined}
            onChange={(event) => setEmail(event.target.value)}
          />
          {invite?.email ? (
            // On 04/11/2026 a tester clicked the locked field several times trying to edit it.
            <p id="email-convite-dica" className="text-small text-graphite">
              É o e-mail do convite e não muda. Se estiver errado, peça um novo convite.
            </p>
          ) : null}
          <label htmlFor="nova-senha" className={label}>
            Crie uma senha
          </label>
          <input id="nova-senha" type="password" className={field} autoComplete="new-password" value={password} aria-describedby="senha-dica" onChange={(event) => setPassword(event.target.value)} />
          <p id="senha-dica" className="text-small text-graphite">
            {PASSWORD_MIN} caracteres ou mais.
          </p>
          <label htmlFor="repetir-senha" className={label}>
            Repita a senha
          </label>
          <input id="repetir-senha" type="password" className={field} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
          <section aria-labelledby="termo" className="mt-2 flex flex-col gap-2 rounded-panel bg-surface p-4 shadow-raised">
            <h2 id="termo" className="text-ui font-medium text-ink">
              O que eu guardo e para quê
            </h2>
            <ul className="flex list-disc flex-col gap-1 ps-5 text-small text-ink">
              {CONSENT.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
          <label className="flex min-h-11 items-center gap-3 text-ui text-ink">
            <input type="checkbox" className="size-5 accent-ink" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
            Li e aceito participar do teste nessas condições.
          </label>
          <button type="submit" className={primary} disabled={busy || (!invite?.existing && !name.trim()) || !email || !password}>
            {busy ? "Criando…" : invite?.existing ? "Salvar senha e entrar" : "Criar conta e entrar"}
          </button>
        </form>
      )}

      {error ? (
        <p id="signin-error" role="alert" className="text-ui font-medium text-alert">
          {error}
        </p>
      ) : null}

      {step === "signin" ? (
        <button type="button" className={quiet} onClick={() => go("invite")}>
          Tenho um convite
        </button>
      ) : step === "reset" && resetEmail === null ? null : (
        <button type="button" className={quiet} onClick={() => go(step === "onboarding" ? "invite" : "signin")}>
          {step === "onboarding" ? "Voltar" : step === "invite" ? "Já tenho conta" : "Voltar para entrar"}
        </button>
      )}
      {step === "signin" ? (
        <p className="text-small text-graphite">Ainda não tem conta? A tone está em teste fechado, só com convite.</p>
      ) : null}
    </Frame>
  );
}
