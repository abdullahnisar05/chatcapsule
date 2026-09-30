export type SearchEntry = {
  id: string;
  text: string;
};

export function searchEntries(entries: SearchEntry[], query: string): string[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  return entries
    .filter((entry) => entry.text.includes(normalizedQuery))
    .map((entry) => entry.id);
}
