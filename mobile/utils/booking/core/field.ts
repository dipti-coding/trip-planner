import type {Field, FieldSource, ItemDraft} from './types';

export function emptyItem(): ItemDraft {
  return {fields: {}};
}

// Set a field only when the value is present AND its confidence beats whatever is
// already there. This lets deterministic stages (high confidence) win over the LLM,
// and lets the LLM fill only what determinism left empty.
export function setField(
  item: ItemDraft,
  name: string,
  value: string | undefined | null,
  confidence: number,
  source: FieldSource,
): void {
  if (value == null || value === '') return;
  const existing = item.fields[name];
  if (existing && existing.confidence >= confidence) return;
  item.fields[name] = {value, confidence, source};
}

export function getValue(item: ItemDraft, name: string): string | undefined {
  return item.fields[name]?.value;
}

export function hasField(item: ItemDraft, name: string): boolean {
  const f: Field | undefined = item.fields[name];
  return f != null && f.value !== '';
}

// Flatten all field values to a plain map (used to build details / plan scalars).
export function itemToValues(item: ItemDraft): Record<string, string> {
  return Object.fromEntries(
    Object.entries(item.fields).map(([k, f]) => [k, f.value]),
  );
}
