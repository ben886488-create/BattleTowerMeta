type CountryLocale = "zh" | "en";

const displayNameCache = new Map<CountryLocale, Intl.DisplayNames>();

function getDisplayNames(locale: CountryLocale) {
  const cached = displayNameCache.get(locale);
  if (cached) return cached;

  const displayNames = new Intl.DisplayNames([locale === "zh" ? "zh-Hant" : "en"], {
    type: "region",
  });
  displayNameCache.set(locale, displayNames);
  return displayNames;
}

export function getCountryDisplayName(
  code: string | undefined,
  locale: CountryLocale,
  unknownLabel: string,
) {
  if (!code || code === "UNKNOWN") return unknownLabel;

  try {
    return getDisplayNames(locale).of(code.toUpperCase()) || code;
  } catch {
    return code;
  }
}
