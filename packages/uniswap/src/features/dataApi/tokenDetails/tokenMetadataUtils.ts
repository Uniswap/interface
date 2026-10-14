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
