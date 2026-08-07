import { type InAppNotification, OnClickAction } from '@universe/api'
import { UNISWAP_WEB_HOSTNAME } from 'uniswap/src/constants/urls'

/**
 * Resolves a notification `onClickLink` to the in-app path it would navigate to.
 * Returns undefined for links that leave the app (or that can't be parsed).
 *
 * Absolute `app.uniswap.org` links resolve as in-app even when the current origin is
 * localhost or a preview deploy, so server content using absolute URLs behaves the same
 * everywhere.
 */
export function getInAppDestination(
  link: string | undefined,
  options?: { onParseError?: (error: unknown) => void },
): string | undefined {
  if (!link) {
    return undefined
  }

  // `//host/path` is protocol-relative, not an in-app path.
  const isRelativePath = link.startsWith('/') && !link.startsWith('//')

  try {
    const url = new URL(link, window.location.origin)
    const isInApp = isRelativePath || url.origin === window.location.origin || url.hostname === UNISWAP_WEB_HOSTNAME

    if (!isInApp) {
      return undefined
    }

    return url.pathname + url.search + url.hash
  } catch (error) {
    options?.onParseError?.(error)
    return undefined
  }
}

type ParsedDestination = { pathname: string; params: URLSearchParams; hash: string }

/**
 * Splits an in-app destination (path + search + hash) into comparable parts, dropping a trailing
 * slash from the path.
 *
 * The origin is prefixed onto the path rather than passed as a base, because `new URL` reads a
 * leading `//` as protocol-relative: `app.uniswap.org//explore` yields the pathname `//explore`,
 * which as a base-relative URL resolves to host `explore` (normalizing to `/`) and, for a bare
 * `//`, throws. Total by construction — any unparseable value yields undefined.
 */
function parseDestination(destination: string): ParsedDestination | undefined {
  try {
    const path = destination.startsWith('/') ? destination : `/${destination}`
    const url = new URL(`${window.location.origin}${path}`)
    const pathname = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') || '/' : url.pathname

    return { pathname, params: url.searchParams, hash: url.hash }
  } catch {
    return undefined
  }
}

/**
 * Canonical form of an in-app destination, so equivalent URLs compare equal.
 * Drops a trailing slash and sorts query params; the hash is left alone.
 * Returns undefined when the destination can't be parsed.
 */
export function normalizeDestination(destination: string): string | undefined {
  const parsed = parseDestination(destination)
  if (!parsed) {
    return undefined
  }

  const params = new URLSearchParams(parsed.params)
  params.sort()
  const search = params.toString()

  return `${parsed.pathname}${search ? `?${search}` : ''}${parsed.hash}`
}

/**
 * Whether clicking through to `destination` would land on the page you're already on.
 *
 * The destination's params must be a *subset* of the current ones, not equal to them: arriving on
 * `/explore?utm_source=blog` from a campaign link still means a banner pointing at `/explore` has
 * nothing to offer, while `/explore/tokens/1/0xabc?modal=earn-vault` does real work on that token
 * page precisely because the param isn't there yet. The hash follows the same rule.
 */
export function isDestinationAlreadyActive(destination: string, currentDestination: string): boolean {
  const target = parseDestination(destination)
  const current = parseDestination(currentDestination)

  if (!target || !current || target.pathname !== current.pathname) {
    return false
  }

  if (target.hash && target.hash !== current.hash) {
    return false
  }

  for (const [key, value] of target.params) {
    if (!current.params.getAll(key).includes(value)) {
      return false
    }
  }

  return true
}

/**
 * The normalized in-app destination a notification's click leads to, or undefined when it
 * leads off-app, opens a chained notification, or has no link at all.
 *
 * Buttons are checked before the background: a button is the call to action and the likelier
 * click, so a no-op background target must not mask the working deep link a button carries.
 * Only `EXTERNAL_LINK` targets carry a URL — `onClickLink` holds a notification id for `POPUP`,
 * so the action must be checked, not the mere presence of a link. `onDismissClick` is
 * deliberately excluded: dismissing isn't navigation.
 */
export function getNotificationDestination(notification: InAppNotification): string | undefined {
  const content = notification.content
  if (!content) {
    return undefined
  }

  const targets = [...content.buttons.map((button) => button.onClick), content.background?.backgroundOnClick]

  for (const target of targets) {
    if (!target?.onClick.includes(OnClickAction.EXTERNAL_LINK)) {
      continue
    }

    const destination = getInAppDestination(target.onClickLink)
    const normalized = destination ? normalizeDestination(destination) : undefined
    if (normalized) {
      return normalized
    }
  }

  return undefined
}
