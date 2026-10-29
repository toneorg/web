// Gerado de toneorg/extension@bc3273ad0a23 (packages/genui-react/src/format.ts). Não edite aqui.
export const brl = (value: number | null | undefined) =>
  value === null || value === undefined
    ? "Preço não informado"
    : value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: value % 1 ? 2 : 0 });

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "America/Sao_Paulo" });
