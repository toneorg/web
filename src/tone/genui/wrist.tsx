// Gerado de toneorg/extension@568dac5bb6b0 (packages/genui-react/src/wrist.tsx). Não edite aqui.
// The watch on the wrist (RF5.4) and the reasons a product can be turned down,
// shared by the generated components and the older tool-call cards.
import { fitVerdict, wristWidthMm } from "./fit";

export const REJECT_REASONS = {
  preco: "Preço",
  estilo: "Estilo",
  qualidade: "Qualidade",
  tamanho: "Tamanho",
  outro: "Outro motivo",
} as const;
export type RejectReason = keyof typeof REJECT_REASONS;

/** A top view of the wrist with the watch case to scale. */
export function Fit(props: { caseMm: number; wristCm: number; label: string }) {
  const scale = 2.4;
  const wrist = wristWidthMm(props.wristCm) * scale;
  const watch = props.caseMm * scale;
  const verdict = fitVerdict(props.caseMm, props.wristCm);
  const cx = 160;
  const cy = 100;
  return (
    <section className="card fit" aria-label={props.label}>
      <h3>{props.label}</h3>
      <svg viewBox="0 0 320 200" role="img" aria-label={`Caixa de ${props.caseMm} mm num pulso de ${props.wristCm} cm`}>
        <rect x="0" y={cy - wrist / 2} width="320" height={wrist} rx={wrist / 2} fill="currentColor" opacity="0.08" />
        <rect x={cx - watch * 0.32} y="0" width={watch * 0.64} height="200" fill="currentColor" opacity="0.18" />
        <circle cx={cx} cy={cy} r={watch / 2} fill="none" stroke="currentColor" strokeWidth="3" />
        <circle cx={cx} cy={cy} r={watch / 2 - 8} fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        <line x1={cx} y1={cy} x2={cx} y2={cy - watch / 3} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={cx + watch / 4} y2={cy} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <p className="verdict-line">{verdict.label}</p>
      <p className="small muted">
        Caixa de {props.caseMm} mm; para um pulso de {props.wristCm.toLocaleString("pt-BR")} cm, o confortável vai de{" "}
        {verdict.range[0]} a {verdict.range[1]} mm.
      </p>
    </section>
  );
}
