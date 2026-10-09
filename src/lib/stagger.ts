// Positions in a staged entrance, as the CSS custom properties globals.css
// reads. No directive: server sections and client components both use these.

/** An element's own place in the sequence (`rise`, `reveal-item`, `strike`, `uncover`, `pop`). */
export function order(i: number) {
  return { "--i": i } as React.CSSProperties;
}

/**
 * A card's place, also handed down to the marks inside it. `--i` does not
 * inherit (see `@property --i`), so the card passes its place on as `--card`.
 */
export function card(i: number) {
  return { "--i": i, "--card": i } as React.CSSProperties;
}

/** A mark's place inside its card. */
export function within(j: number) {
  return { "--j": j } as React.CSSProperties;
}
