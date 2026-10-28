// Gerado de toneorg/extension@ae98f09796c8 (packages/shared/src/context.ts). Não edite aqui.
// Kept apart from the schemas so the content script can use it without zod.
import type { PageContext, PageSnapshot } from "./page";

export function contextOf(snapshot: PageSnapshot): PageContext {
  return {
    url: snapshot.url,
    site: snapshot.site,
    kind: snapshot.kind,
    title: snapshot.title,
    productTitle: snapshot.product?.title ?? null,
    productPrice: snapshot.product?.price ?? null,
  };
}
