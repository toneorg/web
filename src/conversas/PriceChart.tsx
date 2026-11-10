"use client";
// The price chart of a panel: the lowest price tone saw per day, and the target price when the
// panel has one. Asked in the test of 04/11/2026 ("um negócio mais gráfico, que nem o Buscapé").
// One series, so no legend: the title names it. Ink for the line, graphite for the target, rule
// for the baseline; hover (or focus and arrow keys) shows the day; a hidden table reads it out.
import { type KeyboardEvent, useId, useMemo, useState } from "react";
import type { WatchPrices } from "@/tone/shared";

const WIDTH = 320;
const HEIGHT = 112;
const PAD = { top: 12, right: 8, bottom: 20, left: 8 };

const brl = (amount: number) =>
  amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: amount >= 100 ? 0 : 2 });
const shortDay = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;

export function PriceChart(props: { prices: WatchPrices }) {
  const { points, target } = props.prices;
  const titleId = useId();
  const [active, setActive] = useState<number | null>(null);

  const geometry = useMemo(() => {
    if (points.length < 2) return null;
    const amounts = points.map((point) => point.amount).concat(target ?? []);
    let min = Math.min(...amounts);
    let max = Math.max(...amounts);
    if (max - min < 1) {
      min -= 1;
      max += 1;
    }
    const span = max - min;
    min -= span * 0.1;
    max += span * 0.1;
    // Time on x by day, so a gap of days without a reading stays a gap.
    const first = Date.parse(points[0]?.day ?? "");
    const last = Date.parse(points.at(-1)?.day ?? "");
    const days = Math.max(1, (last - first) / 86_400_000);
    const x = (day: string) =>
      PAD.left + ((Date.parse(day) - first) / 86_400_000 / days) * (WIDTH - PAD.left - PAD.right);
    const y = (amount: number) => PAD.top + (1 - (amount - min) / (max - min)) * (HEIGHT - PAD.top - PAD.bottom);
    const xy = points.map((point) => ({ ...point, x: x(point.day), y: y(point.amount) }));
    return { xy, y, path: xy.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") };
  }, [points, target]);

  if (!geometry) return null;
  const { xy, y, path } = geometry;
  const lowest = xy.reduce((best, point) => (point.amount < best.amount ? point : best));
  const lastPoint = xy.at(-1);
  const shown = active === null ? null : xy[active];

  const nearest = (clientX: number, rect: DOMRect) => {
    const at = ((clientX - rect.left) / rect.width) * WIDTH;
    let index = 0;
    for (let i = 1; i < xy.length; i++)
      if (Math.abs((xy[i]?.x ?? 0) - at) < Math.abs((xy[index]?.x ?? 0) - at)) index = i;
    return index;
  };
  const onKey = (event: KeyboardEvent<SVGSVGElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const from = active ?? xy.length - 1;
    setActive(Math.max(0, Math.min(xy.length - 1, from + (event.key === "ArrowRight" ? 1 : -1))));
  };

  return (
    <figure className="relative z-[1] flex flex-col gap-1">
      <figcaption id={titleId} className="flex flex-col text-caption text-graphite">
        <span>Menor preço por dia</span>
        {/* One fixed line, so hovering never changes the card's height. */}
        <span className="truncate text-ink tabular-nums" aria-live="polite">
          {shown ? `${shortDay(shown.day)}: ${brl(shown.amount)}${shown.store ? ` · ${shown.store}` : ""}` : `menor ${brl(lowest.amount)} em ${shortDay(lowest.day)}`}
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-28 w-full touch-none overflow-visible text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        role="img"
        aria-labelledby={titleId}
        tabIndex={0}
        onPointerMove={(event) => setActive(nearest(event.clientX, event.currentTarget.getBoundingClientRect()))}
        onPointerLeave={() => setActive(null)}
        onBlur={() => setActive(null)}
        onKeyDown={onKey}
      >
        <line x1={PAD.left} x2={WIDTH - PAD.right} y1={HEIGHT - PAD.bottom} y2={HEIGHT - PAD.bottom} className="stroke-rule" strokeWidth={1} />
        {target !== null ? (
          <g className="text-graphite">
            <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(target)} y2={y(target)} stroke="currentColor" strokeWidth={1} strokeDasharray="4 4" />
            {/* At the start, away from the last point's marker; below the line when the line is near the top. */}
            <text x={PAD.left} y={y(target) < PAD.top + 12 ? y(target) + 12 : y(target) - 4} fill="currentColor" fontSize={10}>
              alvo {brl(target)}
            </text>
          </g>
        ) : null}
        <path d={path} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {shown ? (
          <line x1={shown.x} x2={shown.x} y1={PAD.top} y2={HEIGHT - PAD.bottom} className="stroke-rule" strokeWidth={1} />
        ) : null}
        {(shown ? [shown] : lastPoint ? [lastPoint] : []).map((point) => (
          <circle key={point.day} cx={point.x} cy={point.y} r={4} fill="currentColor" className="stroke-surface" strokeWidth={2} />
        ))}
        <text x={PAD.left} y={HEIGHT - 6} className="fill-graphite" fontSize={10}>
          {shortDay(xy[0]?.day ?? "")}
        </text>
        <text x={WIDTH - PAD.right} y={HEIGHT - 6} textAnchor="end" className="fill-graphite" fontSize={10}>
          {shortDay(lastPoint?.day ?? "")}
        </text>
      </svg>
      <table className="sr-only">
        <caption>Menor preço que a tone viu em cada dia</caption>
        <thead>
          <tr>
            <th scope="col">Dia</th>
            <th scope="col">Menor preço</th>
            <th scope="col">Loja</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.day}>
              <td>{shortDay(point.day)}</td>
              <td>{brl(point.amount)}</td>
              <td>{point.store ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
