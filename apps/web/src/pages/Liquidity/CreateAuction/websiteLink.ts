const BLOCKED_WEBSITE_LINK_SCHEME_PATTERN = /^\s*(javascript|data|vbscript|file):/i

/** Rejects dangerous URI schemes while the user is still typing. */
export function isAllowedWebsiteLinkInput(value: string): boolean {
  if (BLOCKED_WEBSITE_LINK_SCHEME_PATTERN.test(value)) {
    return false
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return true
  }

  if (/^https:\/\//i.test(trimmed) || /^http:\/\//i.test(trimmed)) {
    return true
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    return false
  }

  return true
}

/** Normalizes user input to an https URL (prepends scheme or upgrades http). */
export function normalizeWebsiteLink(value: string): string {
  const trimmed = value.trim()
  if (!trimmed || !isAllowedWebsiteLinkInput(trimmed)) {
    return trimmed
  }

  if (/^http:\/\//i.test(trimmed)) {
    return `https://${trimmed.slice('http://'.length)}`
  }

  if (/^https:\/\//i.test(trimmed)) {
    return trimmed
  }

  return `https://${trimmed.replace(/^\/+/, '')}`
}

export function stripTrailingSlashesFromWebsiteUrl(value: string): string {
  return value.trim().replace(/\/+$/, '')
}

/** Optional field: empty is valid; non-empty must be a safe https URL. */
export function isValidWebsiteLink(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) {
    return true
  }

  if (!isAllowedWebsiteLinkInput(trimmed)) {
    return false
  }

  try {
    const url = new URL(normalizeWebsiteLink(trimmed))
    return url.protocol === 'https:' && url.hostname.length > 0
  } catch {
    return false
  }
}
