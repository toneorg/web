import { MONK } from "@/lib/tones";

/** Ten product-page swatch dots that open into full bands of skin. */
export function HeroBands() {
  return (
    <div
      role="img"
      aria-label="Os dez tons de pele da escala Monk, do mais claro ao mais escuro."
      className="flex h-[30svh] min-h-52 w-full sm:h-[44svh] sm:min-h-80"
    >
      {MONK.map((hex, i) => (
        <div
          key={hex}
          className="band-grow flex-1"
          style={{ background: hex, "--i": i } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
