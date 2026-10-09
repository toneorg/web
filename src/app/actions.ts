"use server";

import type { BrandField, FormState, ProfileField, Submission, WaitlistField } from "@/lib/forms";
import {
  type Parsed,
  isSuspect,
  parseBrand,
  parseProfile,
  parseWaitlist,
} from "@/lib/forms.server";
import { saveSubmission } from "@/lib/storage";

const INVALID = "Falta pouco. Confira os campos marcados.";
const UNAVAILABLE = "Não deu para salvar agora. Tente de novo em alguns segundos.";

/** Validate → save, the same for every form. */
async function submit<F extends string>(
  form: FormData,
  parse: (form: FormData) => Parsed<F, Submission>,
): Promise<FormState<F>> {
  const parsed = parse(form);
  if (!parsed.ok) return { status: "error", message: INVALID, fieldErrors: parsed.errors };

  // A filled trap field is flagged, not thrown away: if a browser's autofill
  // tripped it, the row is still there to be found.
  const suspect = isSuspect(form);
  if (suspect) console.warn(`submit(${parsed.record.kind}): trap field filled, row flagged`);

  try {
    await saveSubmission(suspect ? { ...parsed.record, suspect: true } : parsed.record);
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
