// A frame saved in an old conversation (a call of the first UI tools, show_products and the
// others) drawn again by the same components as today's answers: it becomes the code a block
// of an answer would carry. A frame that does not pass its tool's contract draws nothing.
import { isUiTool, type UiComponent, UiTools } from "@/tone/shared";

const s = (value: string | null) => (value === null ? "null" : JSON.stringify(value));
const n = (value: number | null) => (value === null ? "null" : String(value));
const list = (values: string[]) => `[${values.join(", ")}]`;

interface Saved {
  title: string;
  url: string;
  price: number | null;
  image: string | null;
  rating: number | null;
  reasons: string[];
  caveat: string | null;
}

/** One line per product, named p0, p1…, so the parent lists them by name. */
const products = (items: Saved[]) =>
  items.map(
    (p, i) =>
      `p${i} = Product(${s(p.title)}, ${s(p.url)}, ${n(p.price)}, ${s(p.image)}, ${n(p.rating)}, null, ${list(p.reasons.map(s))}, ${s(p.caveat)})`,
  );
const names = (items: unknown[], prefix: string) => list(items.map((_, i) => `${prefix}${i}`));

export function savedFrameCode(component: UiComponent): string | null {
  if (!isUiTool(component.name)) return null;
  switch (component.name) {
    case "show_products": {
      const parsed = UiTools.show_products.args.safeParse(component.props);
      if (!parsed.success) return null;
      const { title, products: items } = parsed.data;
      return ["root = View([c])", `c = ProductCarousel(${s(title)}, ${names(items, "p")})`, ...products(items)].join("\n");
    }
    case "show_comparison": {
      const parsed = UiTools.show_comparison.args.safeParse(component.props);
      if (!parsed.success) return null;
      const { products: items, attributes, recommended, verdict } = parsed.data;
      return [
        "root = View([c])",
        `c = ComparisonMatrix(${names(items, "p")}, ${names(attributes, "r")}, ${recommended}, ${s(verdict)})`,
        ...products(items),
        ...attributes.map((row, i) => `r${i} = MatrixRow(${s(row.label)}, ${list(row.values.map(s))})`),
      ].join("\n");
    }
    case "ask_this_or_that": {
      const parsed = UiTools.ask_this_or_that.args.safeParse(component.props);
      if (!parsed.success) return null;
      const { question, memoryKey, options } = parsed.data;
      return [
        "root = View([c])",
        `c = VisualChoice(${s(question)}, ${s(memoryKey)}, ${names(options, "o")})`,
        ...options.map((option, i) => `o${i} = ChoiceOption(${s(option.label)}, ${s(option.image)})`),
      ].join("\n");
    }
    case "quick_question": {
      const parsed = UiTools.quick_question.args.safeParse(component.props);
      if (!parsed.success) return null;
      const { question, memoryKey, options } = parsed.data;
      return ["root = View([c])", `c = PreferenceChips(${s(question)}, ${s(memoryKey)}, ${list(options.map(s))})`].join("\n");
    }
    case "show_fit": {
      const parsed = UiTools.show_fit.args.safeParse(component.props);
      if (!parsed.success) return null;
      const { caseMm, wristCm, label } = parsed.data;
      return ["root = View([c])", `c = WristFit(${caseMm}, ${wristCm}, ${s(label)})`].join("\n");
    }
  }
}
