// The bench's controls as classes, from the design system's sheets (components/field.md and
// button.md), so a field or a button looks the same in the sign-in, the profile and the feedback.

const ring = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

/** A text field: 52 tall, 1px `rule` border, 16px text; focus and invalid in the outline, never in the border. */
export const field =
  "min-h-13 w-full rounded-input border border-rule bg-surface px-4 text-body text-ink placeholder:text-graphite focus-visible:outline-2 focus-visible:outline-ink aria-invalid:outline-2 aria-invalid:outline-alert";

/** The same field over several lines. */
export const textArea = `${field} resize-none py-3`;

/** Secondary action (`outline`). */
export const outlineButton = `press min-h-11 rounded-full bg-surface px-5 text-ui text-ink shadow-raised disabled:opacity-50 ${ring}`;

/** Main action (`solid`). */
export const solidButton = `press min-h-11 rounded-full bg-ink px-5 text-ui text-on-ink disabled:bg-rule disabled:text-graphite ${ring}`;

/** Destructive action (`danger`). */
export const dangerButton = `press min-h-11 rounded-full bg-surface px-5 text-ui text-alert shadow-raised disabled:opacity-50 ${ring}`;
