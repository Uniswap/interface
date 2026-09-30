import { Language, mapLanguageToLocale } from 'uniswap/src/features/language/constants'

/**
 * Canonical token metadata shape
 */
export interface TokenMetadataData {
  name?: string
  symbol?: string
  logoUrl?: string
  description?: string
  descriptionTranslations?: Record<string, string>
  homepageUrl?: string
  twitterName?: string
  isSpam?: boolean
}

const X_HANDLE_REGEX = /^[A-Za-z0-9_]{1,15}$/
const X_PROTOCOLS = ['https://', 'http://']
const X_HOSTS = ['twitter.com/', 'x.com/']

/** Strips a leading (protocol)(www.)twitter.com|x.com/ prefix case-insensitively; non-X-URL input passes through untouched. */
function stripXUrlPrefix(value: string): string {
  const lower = value.toLowerCase()
  let offset = X_PROTOCOLS.find((protocol) => lower.startsWith(protocol))?.length ?? 0
  if (lower.startsWith('www.', offset)) {
    offset += 'www.'.length
  }
  const host = X_HOSTS.find((candidate) => lower.startsWith(candidate, offset))
  return host ? value.slice(offset + host.length) : value
}

/**
 * Backend sources disagree on shape: EVM metadata carries a bare handle while Solana metadata
 * carries a full profile URL. Reduce both to a validated bare handle, or undefined so callers
 * hide the link instead of building an invalid URL.
 */
export function normalizeTwitterHandle(raw: string | undefined): string | undefined {
  if (!raw) {
    return undefined
  }
  let handle = stripXUrlPrefix(raw.trim())
  handle = handle.split(/[/?#]/)[0] ?? ''
  if (handle.startsWith('@')) {
    handle = handle.slice(1)
  }
  return X_HANDLE_REGEX.test(handle) ? handle : undefined
}

function languageSubtag(localeKey: string): string {
  return localeKey.split('-')[0]?.toLowerCase() ?? localeKey.toLowerCase()
}

/**
 * Picks the description translation for `language` out of the REST translations map.
 *
 * The proto declares the map as `map<string, string>` without documenting the key format, so
 * this assumes IETF locale tags matching the app's `Locale` values (`es-ES`, `zh-Hant`, ...).
 * Lookup is case-insensitive and degrades gracefully: exact locale, then the bare language
 * subtag (`es`), then any key sharing that subtag so regional variants like es-419 still get
 * the one Spanish translation the backend has.
 */
export function getTranslatedDescription(
  translations: Record<string, string> | undefined,
  language: Language,
): string | undefined {
  if (!translations || language === Language.English) {
    return undefined
  }

  const locale = mapLanguageToLocale[language].toLowerCase()
  const subtag = languageSubtag(locale)
  const keys = Object.keys(translations)

  const matchedKey =
    keys.find((key) => key.toLowerCase() === locale) ??
    keys.find((key) => key.toLowerCase() === subtag) ??
    keys.find((key) => languageSubtag(key) === subtag)

  return matchedKey && translations[matchedKey] ? translations[matchedKey] : undefined
}
