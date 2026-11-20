import { PreferredStoreDomain, type StorePreferenceCategory, type StorePreferences } from "@/tone/shared";

/** Saving preferences has no search side effect. The second action waits for a successful save. */
export async function saveStorePreferences(
  category: StorePreferenceCategory,
  stores: string[],
  save: (category: StorePreferenceCategory, stores: string[]) => Promise<StorePreferences>,
  research?: () => Promise<void>,
): Promise<StorePreferences> {
  const saved = await save(category, stores);
  if (research) await research();
  return saved;
}

export function preferredDomain(value: string): string | null {
  const parsed = PreferredStoreDomain.safeParse(value);
  return parsed.success ? parsed.data : null;
}
