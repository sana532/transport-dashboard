/** Local labels for Syrian cities/governorates. The catalog API only stores `name`. */

type CityNamePair = { en: string; ar: string }

const CITY_NAME_PAIRS: Array<CityNamePair & { aliases?: string[] }> = [
  { en: 'Damascus', ar: 'دمشق', aliases: ['dimashq'] },
  { en: 'Rural Damascus', ar: 'ريف دمشق', aliases: ['rif dimashq', 'damascus countryside'] },
  { en: 'Aleppo', ar: 'حلب', aliases: ['halab'] },
  { en: 'Homs', ar: 'حمص', aliases: ['hims'] },
  { en: 'Hama', ar: 'حماة', aliases: ['hamah'] },
  { en: 'Lattakia', ar: 'اللاذقية', aliases: ['latakia', 'al ladhiqiyah', 'al-ladhiqiyah'] },
  { en: 'Tartus', ar: 'طرطوس', aliases: ['tartous'] },
  { en: 'Idlib', ar: 'إدلب' },
  { en: 'Daraa', ar: 'درعا', aliases: ["dar'a", 'deraa', 'dara'] },
  { en: 'As-Suwayda', ar: 'السويداء', aliases: ['suwayda', 'sweida', 'as suwayda'] },
  { en: 'Quneitra', ar: 'القنيطرة', aliases: ['al qunaytirah', 'al-qunaytirah'] },
  { en: 'Deir ez-Zor', ar: 'دير الزور', aliases: ['deir ezzor', 'dayr az zawr', 'deir al-zor'] },
  { en: 'Raqqa', ar: 'الرقة', aliases: ['ar-raqqah', 'ar raqqah'] },
  { en: 'Hasakah', ar: 'الحسكة', aliases: ['al-hasakah', 'al hasakah', 'al-hasaka'] },
]

function normalizeCityKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[''`]/g, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
}

const CITY_NAME_LOOKUP = new Map<string, CityNamePair>()

for (const pair of CITY_NAME_PAIRS) {
  CITY_NAME_LOOKUP.set(normalizeCityKey(pair.en), pair)
  CITY_NAME_LOOKUP.set(normalizeCityKey(pair.ar), pair)
  for (const alias of pair.aliases ?? []) {
    CITY_NAME_LOOKUP.set(normalizeCityKey(alias), pair)
  }
}

export function translateCityName(name: string | null | undefined, locale: string): string {
  const raw = name?.trim()
  if (!raw) return ''
  const pair = CITY_NAME_LOOKUP.get(normalizeCityKey(raw))
  if (!pair) return raw
  return locale === 'ar' ? pair.ar : pair.en
}
