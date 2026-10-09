"use server";

import {
  type BrandField,
  type FormState,
  type Parsed,
  type ProfileField,
  type Submission,
  type WaitlistField,
  isBot,
  parseBrand,
  parseProfile,
  parseWaitlist,
} from "@/lib/forms";
import { saveSubmission } from "@/lib/storage";

const INVALID = "Falta pouco. Confira os campos marcados.";
const UNAVAILABLE = "Não deu para salvar agora. Tente de novo em alguns segundos.";

/** Honeypot → validate → save, the same for every form. */
async function submit<F extends string>(
  form: FormData,
  parse: (form: FormData) => Parsed<F, Submission>,
): Promise<FormState<F>> {
  // Bots that fill the hidden field get a silent success.
  if (isBot(form)) return { status: "ok" };

  const parsed = parse(form);
  if (!parsed.ok) return { status: "error", message: INVALID, fieldErrors: parsed.errors };

  try {
    await saveSubmission(parsed.record);
  } catch (error) {
    console.error(`submit(${parsed.record.kind})`, error);
    return { status: "error", message: UNAVAILABLE, fieldErrors: {} };
  }
  return { status: "ok" };
}

export async function joinWaitlist(
  _prev: FormState<WaitlistField>,
  form: FormData,
): Promise<FormState<WaitlistField>> {
  return submit(form, parseWaitlist);
}

export async function saveProfile(
  _prev: FormState<ProfileField>,
  form: FormData,
): Promise<FormState<ProfileField>> {
  return submit(form, parseProfile);
}

export async function requestPilot(
  _prev: FormState<BrandField>,
  form: FormData,
): Promise<FormState<BrandField>> {
  return submit(form, parseBrand);
}
