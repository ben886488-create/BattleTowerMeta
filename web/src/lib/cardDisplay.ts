export type CardMetaInput = Record<string, unknown> | null | undefined;

export interface NormalizedCardMeta {
  name: string;
  packVersion: string;
  packCode: string;
  illustrator: string;
}

function cleanMetaText(value: unknown) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const text = cleanMetaText(value);
    if (text) return text;
  }
  return "";
}

function normalizeSetCode(value: unknown) {
  return cleanMetaText(value).toUpperCase();
}

function normalizeCardNumber(value: unknown) {
  const text = cleanMetaText(value);
  if (!text) return "";
  return text.replace(/^#/, "");
}

function buildPackCode(card: Record<string, unknown>) {
  const explicit = firstText(
    card.packCode,
    card.cardCode,
    card.codeLabel,
    card.code,
    card.id,
  );
  if (explicit) return explicit;

  const setCode = normalizeSetCode(card.setCode ?? card.set_code ?? card.set);
  const number = normalizeCardNumber(card.numberLabel ?? card.number ?? card.no);
  if (setCode && number) return `${setCode}-${number}`;
  return setCode || number;
}

const ILLUSTRATOR_STOP_WORDS = new Set([
  "A",
  "An",
  "As",
  "At",
  "Hidden",
  "If",
  "In",
  "It",
  "Its",
  "Once",
  "The",
  "These",
  "This",
  "Those",
  "Vine",
  "When",
  "Whenever",
  "While",
  "With",
]);

function looksLikeSentenceToken(value: string) {
  return ILLUSTRATOR_STOP_WORDS.has(value.replace(/[^A-Za-z]/g, ""));
}

function extractIllustratorFromText(value: unknown) {
  const text = cleanMetaText(value);
  const match = text.match(/Illustrated by\s+(.+)$/i);
  const segment = cleanMetaText(match?.[1])
    .replace(/\s+[A-Za-z0-9' -]+\([A-Z0-9a-z-]+\)\s+#\d+[a-z]?\s*$/i, "")
    .replace(/\s+(?:[A-Z]\d+[a-z]?|P-[A-Z]|Promo-[A-Z])\s+#\d+[a-z]?\s*$/i, "");
  if (!segment) return "";

  const tokens = segment
    .split(/\s+/)
    .map((token) => token.replace(/[.,;:]+$/, ""))
    .filter(Boolean);

  if (!tokens.length) return "";

  const picked: string[] = [];
  for (const token of tokens.slice(0, 4)) {
    if (picked.length > 0 && looksLikeSentenceToken(token)) break;
    picked.push(token);

    const next = tokens[picked.length];
    if (!next) break;
    if (picked.length >= 2 && looksLikeSentenceToken(next)) break;
    if (picked.length >= 1 && /^[a-z0-9_.-]/.test(token) && /^[A-Z]/.test(next)) break;
  }

  return cleanMetaText(picked.join(" "));
}

export function normalizeCardMeta(input: CardMetaInput): NormalizedCardMeta {
  const card = input && typeof input === "object" ? input : {};
  const packCode = buildPackCode(card);
  const setCode = normalizeSetCode(card.setCode ?? card.set_code ?? card.set);
  const setName = firstText(card.packVersion, card.packName, card.setName, card.set_name, card.expansion);

  return {
    name: firstText(card.name, card.cardName, card.title, card.label),
    packVersion: setName && setCode && !setName.includes(setCode) ? `${setCode} - ${setName}` : setName || setCode,
    packCode,
    illustrator: firstText(
      card.illustrator,
      card.illustratorName,
      card.illustrator_name,
      card.artist,
      card.artistName,
      extractIllustratorFromText(card.pageLine ?? card.page_line),
    ),
  };
}

export function displayCardMetaValue(value: string) {
  return cleanMetaText(value) || "—";
}
