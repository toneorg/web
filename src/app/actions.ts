"use server";

import { saveSubmission } from "@/lib/storage";

export type FieldErrors = Partial<Record<string, string>>;

export type FormState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors: FieldErrors }
  | { status: "ok" };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const text = (form: FormData, key: string, max = 200) =>
  String(form.get(key) ?? "")
    .trim()
    .slice(0, max);

function attribution(form: FormData) {
  return {
    utmSource: text(form, "utm_source", 80),
    utmMedium: text(form, "utm_medium", 80),
    utmCampaign: text(form, "utm_campaign", 80),
    ref: text(form, "ref", 80),
    referrer: text(form, "referrer", 300),
  };
}

function failed(fieldErrors: FieldErrors): FormState {
  return {
    status: "error",
    message: "Falta pouco. Confira os campos marcados.",
    fieldErrors,
  };
}

const unavailable: FormState = {
  status: "error",
  message:
    "Não conseguimos salvar agora. Tente de novo em alguns segundos.",
  fieldErrors: {},
};

export async function joinWaitlist(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  // Honeypot: people never see this field, bots fill it.
  if (text(form, "company")) return { status: "ok" };

  const tone = text(form, "tone", 4);
  const email = text(form, "email", 160).toLowerCase();
  const wantsToTest = form.get("test") === "on";
  const whatsapp = text(form, "whatsapp", 30);

  const errors: FieldErrors = {};
  if (!/^(10|[1-9]|nd)$/.test(tone))
    errors.tone = "Escolha o tom mais parecido com o seu, ou “Não sei dizer”.";
  if (!EMAIL.test(email)) errors.email = "Digite um e-mail válido.";
  if (wantsToTest && whatsapp.replace(/\D/g, "").length < 10)
    errors.whatsapp = "Digite seu WhatsApp com DDD para combinarmos o teste.";
  if (form.get("consent") !== "on")
    errors.consent = "Precisamos da sua autorização para guardar as respostas.";
  if (Object.keys(errors).length) return failed(errors);

  try {
    await saveSubmission("waitlist", {
      email,
      tone,
      foundation: text(form, "foundation", 120),
      wrongShade: text(form, "wrong_shade", 20),
      wantsToTest,
      whatsapp: wantsToTest ? whatsapp : "",
      ...attribution(form),
    });
  } catch (error) {
    console.error("joinWaitlist", error);
    return unavailable;
  }
  return { status: "ok" };
}

export async function requestPilot(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  if (text(form, "company")) return { status: "ok" };

  const name = text(form, "name", 120);
  const email = text(form, "email", 160).toLowerCase();
  const brand = text(form, "brand", 120);
  const steps = form.getAll("steps").map(String).slice(0, 5);

  const errors: FieldErrors = {};
  if (!name) errors.name = "Digite seu nome.";
  if (!EMAIL.test(email)) errors.email = "Digite um e-mail válido.";
  if (!brand) errors.brand = "Digite o nome da marca.";
  if (!steps.length)
    errors.steps = "Escolha pelo menos um passo, mesmo que seja só a conversa.";
  if (form.get("consent") !== "on")
    errors.consent = "Precisamos da sua autorização para entrar em contato.";
  if (Object.keys(errors).length) return failed(errors);

  try {
    await saveSubmission("brand", {
      name,
      email,
      brand,
      role: text(form, "role", 80),
      site: text(form, "site", 200),
      platform: text(form, "platform", 40),
      shades: text(form, "shades", 20),
      lastComplaint: text(form, "last_complaint", 1000),
      steps,
      ...attribution(form),
    });
  } catch (error) {
    console.error("requestPilot", error);
    return unavailable;
  }
  return { status: "ok" };
}
