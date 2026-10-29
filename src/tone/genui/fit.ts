// Gerado de toneorg/extension@568dac5bb6b0 (packages/genui-react/src/fit.ts). Não edite aqui.
// The watch-size table of the relogio skill, for the fit drawing (RF5.4).
export function recommendedCase(wristCm: number): [number, number] {
  if (wristCm < 15) return [34, 38];
  if (wristCm < 16.5) return [36, 40];
  if (wristCm < 18) return [38, 42];
  if (wristCm < 19.5) return [40, 44];
  return [42, 46];
}

export function fitVerdict(caseMm: number, wristCm: number): { label: string; range: [number, number] } {
  const range = recommendedCase(wristCm);
  if (caseMm < range[0] - 1) return { label: "Fica pequeno no seu pulso", range };
  if (caseMm > range[1] + 1) return { label: "Fica grande no seu pulso", range };
  return { label: "Proporcional ao seu pulso", range };
}

/** Width of the top of the wrist, in mm, from its circumference. */
export const wristWidthMm = (wristCm: number) => (wristCm * 10) / 3.2;
