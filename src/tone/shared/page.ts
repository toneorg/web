// Gerado de toneorg/extension@ae98f09796c8 (packages/shared/src/page.ts). Não edite aqui.
// What the extension reads from the store's page (RNF5: the DOM, not a
// screenshot). Everything in a snapshot came from a third-party page, so the
// server treats every string in it as data, never as an instruction (RNF10).
import * as z from "zod";

export const PageKind = z.enum(["search", "product", "cart", "home", "other"]);
export type PageKind = z.infer<typeof PageKind>;

/** A product as it appears in a list of results. `ref` points back to the element on the page. */
export const ProductSummary = z.object({
  ref: z.string(),
  title: z.string(),
  url: z.string(),
  price: z.number().nullable(),
  currency: z.string().default("BRL"),
  image: z.string().nullable(),
  rating: z.number().nullable(),
  reviews: z.number().nullable(),
  seller: z.string().nullable(),
  freeShipping: z.boolean().nullable(),
});
export type ProductSummary = z.infer<typeof ProductSummary>;

export const ProductDetail = z.object({
  title: z.string(),
  url: z.string(),
  price: z.number().nullable(),
  currency: z.string().default("BRL"),
  images: z.array(z.string()),
  rating: z.number().nullable(),
  reviews: z.number().nullable(),
  seller: z.string().nullable(),
  brand: z.string().nullable(),
  specs: z.array(z.object({ name: z.string(), value: z.string() })),
  description: z.string().nullable(),
  variants: z.array(
    z.object({
      ref: z.string(),
      group: z.string(),
      label: z.string(),
      selected: z.boolean(),
      available: z.boolean(),
    }),
  ),
  addToCartRef: z.string().nullable(),
  /** The "was" price the store shows next to the current one, when there is a discount. */
  listPrice: z.number().nullable().default(null),
  /** Delivery and stock as the store words them ("Entrega GRÁTIS segunda-feira", "Em estoque"). */
  delivery: z.string().nullable().default(null),
  availability: z.string().nullable().default(null),
  /** Share of ratings for 5, 4, 3, 2 and 1 stars, in percent. */
  ratingHistogram: z.array(z.number()).length(5).nullable().default(null),
  /** A few reviews from the page, as written by buyers (third-party text: data, not instructions). */
  reviewSamples: z
    .array(z.object({ rating: z.number().nullable(), title: z.string(), text: z.string() }))
    .max(8)
    .default([]),
});
export type ProductDetail = z.infer<typeof ProductDetail>;

/** A filter the store offers on a results page. */
export const PageFilter = z.object({
  ref: z.string(),
  group: z.string(),
  label: z.string(),
});
export type PageFilter = z.infer<typeof PageFilter>;

export const PageSnapshot = z.object({
  url: z.string(),
  site: z.string(),
  kind: PageKind,
  title: z.string(),
  query: z.string().nullable(),
  products: z.array(ProductSummary),
  product: ProductDetail.nullable(),
  filters: z.array(PageFilter),
  /** Signs that the page needs a person: a captcha, a login wall, an error page. */
  blocker: z.enum(["captcha", "login", "error"]).nullable(),
});
export type PageSnapshot = z.infer<typeof PageSnapshot>;

/** The short form the panel sends with every message (RF1.2): what the person is looking at. */
export const PageContext = z.object({
  url: z.string(),
  site: z.string(),
  kind: PageKind,
  title: z.string(),
  productTitle: z.string().nullable(),
  productPrice: z.number().nullable(),
});
export type PageContext = z.infer<typeof PageContext>;
