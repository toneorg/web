"use client";
// The price history of a panel's product, after Buscapé's (25/11/2026: "as linhas dos gráficos dos
// produtos nao da nem para interagir e dizem muito pouco sobre a variação dos preços"): the lowest
// price tone saw each day as a step line (a price holds until the next reading), with price and date
// axes, a period of 30 or 90 days, a crosshair that reads any day (pointer, or focus and the arrow
// keys) with its store, the lowest, normal and highest of the period, and where today's price
// stands between them. One series, so no legend: the title names it. A hidden table reads it out.
import { type KeyboardEvent, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { PriceSignal, WatchPrices } from "@/tone/shared";

const HEIGHT = 220;
const PAD = { top: 16, right: 12, bottom: 28, left: 64 };
const DAY = 86_400_000;
const PERIODS = [
  { days: 30, label: "30 dias" },
  { days: 90, label: "90 dias" },
] as const;

const brl = (amount: number) =>
  amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: amount >= 100 ? 0 : 2 });
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const shortDay = (day: string) => `${Number(day.slice(8, 10))} ${MONTHS[Number(day.slice(5, 7)) - 1] ?? ""}`;
const longDay = (day: string) => `${shortDay(day)} ${day.slice(0, 4)}`;
const storeName = (store: string) =>
  store === "google.com" ? "Google Shopping" : store.replace(/^www\./, "").replace(/\.com(\.br)?$/, "");

/** Round steps for the price axis: 1, 2 or 5 times a power of ten. */
function ticks(min: number, max: number, count = 4): number[] {
  const raw = (max - min) / count || 1;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * power).find((value) => value >= raw) ?? raw;
  // From the step at or below the lowest to the step at or above the highest: every price inside.
  const first = Math.floor(min / step);
  const last = Math.ceil(max / step);
  const values: number[] = [];
  for (let index = first; index <= last; index++) values.push(Math.round(index * step * 100) / 100);
  return values;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? (sorted[middle] ?? 0) : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
}

/** The chart's width in pixels, so the text of the axes is never stretched. */
function useWidth() {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  useLayoutEffect(() => {
    const element = box.current;
    if (!element) return;
    setWidth(Math.max(280, Math.round(element.getBoundingClientRect().width)));
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.max(280, Math.round(entry.contentRect.width)));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return { box, width };
}

const VERDICT: Record<"drop" | "normal" | "high", { word: string; good: boolean }> = {
  drop: { word: "bom", good: true },
  normal: { word: "normal", good: false },
  high: { word: "acima do normal", good: false },
};

export function PriceChart(props: { prices: WatchPrices; signal?: PriceSignal | null; current?: number | null }) {
  const { target } = props.prices;
  const titleId = useId();
  const { box, width } = useWidth();
  const [active, setActive] = useState<number | null>(null);
  const all = props.prices.points;
  const lastDay = all.at(-1)?.day ?? "";
  const spanDays = all.length ? (Date.parse(lastDay) - Date.parse(all[0]?.day ?? lastDay)) / DAY : 0;
  // 90 days only when there is history beyond 30 to show.
  const periods = spanDays > 30 ? PERIODS : PERIODS.slice(0, 1);
  const [period, setPeriod] = useState<number>(30);
  const points = useMemo(() => {
    const since = Date.parse(lastDay) - period * DAY;
    return all.filter((point) => Date.parse(point.day) > since);
  }, [all, lastDay, period]);

  const geometry = useMemo(() => {
    if (points.length < 2) return null;
    const amounts = points.map((point) => point.amount);
    const low = Math.min(...amounts, ...(target ? [target] : []));
    const high = Math.max(...amounts, ...(target ? [target] : []));
    const spread = Math.max(high - low, high * 0.04, 1);
    const yTicks = ticks(low - spread * 0.15, high + spread * 0.15);
    const min = yTicks[0] ?? low;
    const max = yTicks.at(-1) ?? high;
    const first = Date.parse(points[0]?.day ?? "");
    const last = Date.parse(points.at(-1)?.day ?? "");
    const days = Math.max(1, (last - first) / DAY);
    const inner = width - PAD.left - PAD.right;
    const x = (day: string) => PAD.left + ((Date.parse(day) - first) / DAY / days) * inner;
    const y = (amount: number) => PAD.top + (1 - (amount - min) / (max - min || 1)) * (HEIGHT - PAD.top - PAD.bottom);
    const xy = points.map((point) => ({ ...point, x: x(point.day), y: y(point.amount) }));
    // Step after: the price of a reading holds until the next one.
    const line = xy
      .map((p, i) => (i ? `H${p.x.toFixed(1)} V${p.y.toFixed(1)}` : `M${p.x.toFixed(1)},${p.y.toFixed(1)}`))
      .join(" ");
    const base = HEIGHT - PAD.bottom;
    const area = `${line} V${base} H${PAD.left} Z`;
    // About one date label per 110 px, the last one always shown.
    const every = Math.max(1, Math.ceil(xy.length / Math.max(2, Math.floor(inner / 110))));
    const dates = xy.filter((_, i) => i % every === 0 && xy.length - 1 - i >= every / 2).concat(xy.at(-1) ?? []);
    return { xy, y, yTicks, line, area, dates };
  }, [points, target, width]);

  if (all.length < 2)
    return <p className="text-small text-graphite">O gráfico aparece a partir do segundo dia de leitura.</p>;
  if (!geometry) return null;
  const { xy, y, yTicks, line, area, dates } = geometry;
  const amounts = points.map((point) => point.amount);
  const lowest = xy.reduce((best, point) => (point.amount < best.amount ? point : best));
  const highest = Math.max(...amounts);
  const normal = median(amounts);
  const current = props.current ?? xy.at(-1)?.amount ?? null;
  const shown = active === null ? null : xy[active];
  const signal = props.signal && props.signal.kind !== "learning" ? props.signal : null;

  const nearest = (clientX: number, rect: DOMRect) => {
    const at = clientX - rect.left;
    let index = 0;
    for (let i = 1; i < xy.length; i++)
      if (Math.abs((xy[i]?.x ?? 0) - at) < Math.abs((xy[index]?.x ?? 0) - at)) index = i;
    return index;
  };
  const onKey = (event: KeyboardEvent<SVGSVGElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const from = active ?? xy.length - 1;
    const next =
      event.key === "Home" ? 0 : event.key === "End" ? xy.length - 1 : from + (event.key === "ArrowRight" ? 1 : -1);
    setActive(Math.max(0, Math.min(xy.length - 1, next)));
  };
  // Where today's price sits between the period's lowest and highest.
  const place = current === null || highest === lowest.amount ? 0.5 : (current - lowest.amount) / (highest - lowest.amount);
  const normalPlace = highest === lowest.amount ? 0.5 : (normal - lowest.amount) / (highest - lowest.amount);
  const tipLeft = shown ? Math.min(Math.max(shown.x, PAD.left + 70), width - 80) : 0;

  return (
    <figure className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <figcaption id={titleId} className="text-ui text-ink">
          Menor preço por dia
        </figcaption>
        {periods.length > 1 ? (
          <div role="group" aria-label="Período" className="flex gap-1 rounded-full bg-sunken p-1">
            {periods.map((entry) => (
              <button
                key={entry.days}
                type="button"
                aria-pressed={period === entry.days}
                onClick={() => {
                  setPeriod(entry.days);
                  setActive(null);
                }}
                className={`press min-h-11 rounded-full px-4 text-small focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${period === entry.days ? "bg-surface text-ink shadow-raised" : "text-graphite"}`}
              >
                {entry.label}
              </button>
            ))}
          </div>
        ) : (
          <span className="text-small text-graphite">Últimos {Math.max(2, Math.round(spanDays) + 1)} dias</span>
        )}
      </div>

      <div ref={box} className="relative w-full">
        {shown ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 z-[1] -translate-x-1/2 rounded-panel bg-surface px-3 py-2 shadow-raised"
            style={{ left: tipLeft }}
          >
            <p className="text-ui font-semibold text-ink tabular-nums">{brl(shown.amount)}</p>
            <p className="text-caption text-graphite">
              {longDay(shown.day)}
              {shown.store ? ` · ${storeName(shown.store)}` : ""}
            </p>
          </div>
        ) : null}
        <svg
          width={width}
          height={HEIGHT}
          viewBox={`0 0 ${width} ${HEIGHT}`}
          className="block max-w-full touch-none overflow-visible text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          role="img"
          aria-labelledby={titleId}
          aria-describedby={`${titleId}-resumo`}
          tabIndex={0}
          onPointerMove={(event) => setActive(nearest(event.clientX, event.currentTarget.getBoundingClientRect()))}
          onPointerDown={(event) => setActive(nearest(event.clientX, event.currentTarget.getBoundingClientRect()))}
          onPointerLeave={(event) => event.pointerType === "mouse" && setActive(null)}
          onBlur={() => setActive(null)}
          onKeyDown={onKey}
        >
          {yTicks.map((value) => (
            <g key={value}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(value)} y2={y(value)} className="stroke-rule" strokeWidth={1} />
              <text x={PAD.left - 8} y={y(value) + 4} textAnchor="end" className="fill-graphite tabular-nums" fontSize={11}>
                {brl(value)}
              </text>
            </g>
          ))}
          {dates.map((point, index) => (
            <text
              key={point.day}
              x={point.x}
              y={HEIGHT - 8}
              textAnchor={index === 0 ? "start" : index === dates.length - 1 ? "end" : "middle"}
              className="fill-graphite"
              fontSize={11}
            >
              {index === dates.length - 1 ? "Hoje" : shortDay(point.day)}
            </text>
          ))}
          <path d={area} fill="currentColor" fillOpacity={0.06} />
          {target !== null ? (
            <g className="text-graphite">
              <line x1={PAD.left} x2={width - PAD.right} y1={y(target)} y2={y(target)} stroke="currentColor" strokeWidth={1} strokeDasharray="4 4" />
              <text x={width - PAD.right} y={y(target) - 6} textAnchor="end" fill="currentColor" fontSize={11}>
                seu preço {brl(target)}
              </text>
            </g>
          ) : null}
          <path d={line} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {/* The lowest of the period, marked once. */}
          <circle cx={lowest.x} cy={lowest.y} r={4} className="fill-surface" stroke="currentColor" strokeWidth={2} />
          {shown ? (
            <>
              <line x1={shown.x} x2={shown.x} y1={PAD.top} y2={HEIGHT - PAD.bottom} className="stroke-edge" strokeWidth={1} strokeDasharray="3 3" />
              <circle cx={shown.x} cy={shown.y} r={5} fill="currentColor" className="stroke-surface" strokeWidth={2} />
            </>
          ) : (
            <circle cx={xy.at(-1)?.x} cy={xy.at(-1)?.y} r={4} fill="currentColor" className="stroke-surface" strokeWidth={2} />
          )}
        </svg>
      </div>

      {/* The day under the crosshair, read aloud as the arrow keys move it. */}
      <p aria-live="polite" className="sr-only">
        {shown ? `${longDay(shown.day)}: ${brl(shown.amount)}${shown.store ? `, ${storeName(shown.store)}` : ""}` : ""}
      </p>
      <p id={`${titleId}-resumo`} className="sr-only">
        Nos últimos {period} dias: menor {brl(lowest.amount)} em {longDay(lowest.day)}, normal {brl(normal)}, maior{" "}
        {brl(highest)}.
      </p>
      <dl className="grid grid-cols-3 gap-3">
        {[
          { label: "Menor", value: brl(lowest.amount), note: shortDay(lowest.day) },
          { label: "Normal", value: brl(normal), note: "o mais comum" },
          { label: "Maior", value: brl(highest), note: `em ${period} dias` },
        ].map((stat) => (
          <div key={stat.label} className="flex flex-col gap-0.5 rounded-panel bg-sunken px-3 py-2.5">
            <dt className="text-caption text-graphite">{stat.label}</dt>
            <dd className="text-ui font-semibold text-ink tabular-nums">{stat.value}</dd>
            <dd className="text-caption text-graphite">{stat.note}</dd>
          </div>
        ))}
      </dl>

      {current !== null ? (
        <div className="flex flex-col gap-2">
          <p className="text-small text-ink">
            {signal ? (
              <>
                O preço de hoje está{" "}
                <strong className={VERDICT[signal.kind].good ? "text-accent-text" : "text-ink"}>
                  {VERDICT[signal.kind].word}
                </strong>
                : {brl(current)}
                {signal.belowNormal > 0.005
                  ? `, ${Math.round(signal.belowNormal * 100)}% abaixo do normal`
                  : signal.belowNormal < -0.005
                    ? `, ${Math.round(-signal.belowNormal * 100)}% acima do normal`
                    : ", no normal"}
                .
              </>
            ) : (
              <>Hoje: {brl(current)}. Com mais dias de leitura eu digo se está bom.</>
            )}
          </p>
          {/* From the period's lowest to its highest: today as the marker, the normal as a tick. */}
          <div aria-hidden="true" className="relative h-2 rounded-full bg-sunken">
            <span className="absolute inset-y-0 w-0.5 bg-edge" style={{ left: `${Math.min(1, Math.max(0, normalPlace)) * 100}%` }} />
            <span
              className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-ink"
              style={{ left: `calc(${Math.min(1, Math.max(0, place))} * (100% - 1rem) + 0.5rem)` }}
            />
          </div>
          <div aria-hidden="true" className="flex justify-between text-caption text-graphite tabular-nums">
            <span>menor {brl(lowest.amount)}</span>
            <span>maior {brl(highest)}</span>
          </div>
        </div>
      ) : null}

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
              <td>{longDay(point.day)}</td>
              <td>{brl(point.amount)}</td>
              <td>{point.store ? storeName(point.store) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
