import {
  Background,
  Button,
  Content,
  ContentStyle,
  Notification,
  OnClick,
} from '@uniswap/client-notification-service/dist/uniswap/notificationservice/v1/api_pb'
import { type InAppNotification, OnClickAction } from '@universe/api'
import { afterEach, describe, expect, it } from 'vitest'
import {
  getNotificationDestination,
  isDestinationAlreadyActive,
  normalizeDestination,
} from '~/notification-service/utils/getNotificationDestination'

// jsdom serves window.location.origin; these tests assume the default.
const CURRENT_ORIGIN = 'http://localhost:3000'

function createNotification(params: {
  backgroundLink?: { onClick: OnClickAction[]; onClickLink?: string }
  buttonLinks?: { onClick: OnClickAction[]; onClickLink?: string }[]
}): InAppNotification {
  const { backgroundLink, buttonLinks = [] } = params

  return new Notification({
    id: 'test-notification',
    content: new Content({
      style: ContentStyle.LOWER_LEFT_BANNER,
      title: 'Earn on Uniswap',
      background: backgroundLink
        ? new Background({ backgroundOnClick: new OnClick(backgroundLink) })
        : new Background({}),
      buttons: buttonLinks.map((link, index) => new Button({ text: `button-${index}`, onClick: new OnClick(link) })),
    }),
  })
}

function externalLink(onClickLink?: string): { onClick: OnClickAction[]; onClickLink?: string } {
  return { onClick: [OnClickAction.EXTERNAL_LINK], onClickLink }
}

describe('getNotificationDestination', () => {
  it('resolves a relative path', () => {
    const notification = createNotification({ backgroundLink: externalLink('/explore/tokens/ethereum') })

    expect(getNotificationDestination(notification)).toBe('/explore/tokens/ethereum')
  })

  it('resolves an absolute same-origin URL', () => {
    const notification = createNotification({ backgroundLink: externalLink(`${CURRENT_ORIGIN}/positions`) })

    expect(getNotificationDestination(notification)).toBe('/positions')
  })

  it('resolves an absolute app.uniswap.org URL even when the current origin differs', () => {
    expect(window.location.origin).not.toBe('https://app.uniswap.org')

    const notification = createNotification({ backgroundLink: externalLink('https://app.uniswap.org/swap') })

    expect(getNotificationDestination(notification)).toBe('/swap')
  })

  it('returns undefined for a genuinely external URL', () => {
    const notification = createNotification({ backgroundLink: externalLink('https://support.uniswap.org/articles/1') })

    expect(getNotificationDestination(notification)).toBeUndefined()
  })

  it('returns undefined for a protocol-relative URL pointing off-app', () => {
    const notification = createNotification({ backgroundLink: externalLink('//evil.example.com/explore') })

    expect(getNotificationDestination(notification)).toBeUndefined()
  })

  it('returns undefined for POPUP, whose onClickLink holds a notification id rather than a URL', () => {
    const notification = createNotification({
      backgroundLink: { onClick: [OnClickAction.POPUP], onClickLink: 'chained-notification-id' },
    })

    expect(getNotificationDestination(notification)).toBeUndefined()
  })

  it('keeps the query string, so a deep link differs from the bare page it sits on', () => {
    const deepLink = createNotification({
      backgroundLink: externalLink('/explore/tokens/ethereum/0xabc?modal=earn-vault'),
    })
    const barePage = createNotification({ backgroundLink: externalLink('/explore') })

    expect(getNotificationDestination(deepLink)).toBe('/explore/tokens/ethereum/0xabc?modal=earn-vault')
    expect(getNotificationDestination(deepLink)).not.toBe(getNotificationDestination(barePage))
  })

  it('normalizes a trailing slash and query-param order', () => {
    const trailingSlash = createNotification({ backgroundLink: externalLink('/explore/') })
    const noTrailingSlash = createNotification({ backgroundLink: externalLink('/explore') })

    expect(getNotificationDestination(trailingSlash)).toBe(getNotificationDestination(noTrailingSlash))

    const paramsOneOrder = createNotification({ backgroundLink: externalLink('/explore?b=2&a=1') })
    const paramsOtherOrder = createNotification({ backgroundLink: externalLink('/explore?a=1&b=2') })

    expect(getNotificationDestination(paramsOneOrder)).toBe(getNotificationDestination(paramsOtherOrder))
  })

  it('preserves the root path rather than normalizing it away', () => {
    const notification = createNotification({ backgroundLink: externalLink('/') })

    expect(getNotificationDestination(notification)).toBe('/')
  })

  it('returns undefined when onClickLink is missing or empty', () => {
    expect(getNotificationDestination(createNotification({ backgroundLink: externalLink() }))).toBeUndefined()
    expect(getNotificationDestination(createNotification({ backgroundLink: externalLink('') }))).toBeUndefined()
  })

  it('returns undefined when the notification has no clickable targets', () => {
    expect(getNotificationDestination(createNotification({}))).toBeUndefined()
  })

  it('falls back to the first in-app button link when the background has none', () => {
    const notification = createNotification({
      buttonLinks: [
        { onClick: [OnClickAction.DISMISS] },
        externalLink('https://support.uniswap.org/articles/1'),
        externalLink('/positions/create'),
      ],
    })

    expect(getNotificationDestination(notification)).toBe('/positions/create')
  })

  it("prefers a button's deep link over the background, so a no-op background can't mask it", () => {
    const notification = createNotification({
      backgroundLink: externalLink('/explore'),
      buttonLinks: [externalLink('/explore/tokens/1/0xabc?modal=earn-vault')],
    })

    expect(getNotificationDestination(notification)).toBe('/explore/tokens/1/0xabc?modal=earn-vault')
  })

  it('falls back to the background when no button carries an in-app link', () => {
    const notification = createNotification({
      backgroundLink: externalLink('/explore'),
      buttonLinks: [{ onClick: [OnClickAction.DISMISS] }, externalLink('https://support.uniswap.org/articles/1')],
    })

    expect(getNotificationDestination(notification)).toBe('/explore')
  })

  it('keeps a doubled slash on the path instead of reading it as a host', () => {
    // `app.uniswap.org//explore` has the pathname `//explore`, which resolved against the origin
    // would collapse to `/` and suppress on the landing page.
    const notification = createNotification({ backgroundLink: externalLink('https://app.uniswap.org//explore') })

    expect(getNotificationDestination(notification)).toBe('//explore')
  })

  it('handles a bare doubled slash without throwing', () => {
    const notification = createNotification({ backgroundLink: externalLink('https://app.uniswap.org//') })

    expect(getNotificationDestination(notification)).toBe('/')
  })
})

describe('normalizeDestination', () => {
  const originalLocation = window.location

  afterEach(() => {
    Object.defineProperty(window, 'location', { value: originalLocation, writable: true })
  })

  it('treats a bare `//` as a path rather than an empty-host protocol-relative URL', () => {
    expect(normalizeDestination('//')).toBe('/')
  })

  it('treats `//host/path` as a path rather than a protocol-relative URL', () => {
    expect(normalizeDestination('//evil.example.com/explore')).toBe('//evil.example.com/explore')
  })

  it('normalizes values that `new URL(value, origin)` rejects outright', () => {
    expect(() => new URL('//?a=1', window.location.origin)).toThrow()

    expect(normalizeDestination('//?a=1')).toBe('/?a=1')
    expect(normalizeDestination('//[')).toBe('//[')
  })

  it('returns undefined instead of throwing when the origin itself is unparseable', () => {
    Object.defineProperty(window, 'location', { value: { origin: 'null' }, writable: true })

    expect(normalizeDestination('/explore')).toBeUndefined()
  })
})

describe('isDestinationAlreadyActive', () => {
  it('treats the destination as reached when its params are a subset of the current ones', () => {
    expect(isDestinationAlreadyActive('/explore', '/explore?utm_source=blog')).toBe(true)
    expect(isDestinationAlreadyActive('/explore', '/explore')).toBe(true)
  })

  it('does not treat a deep link as reached when the current URL lacks its param', () => {
    expect(isDestinationAlreadyActive('/explore/tokens/1/0xabc?modal=earn-vault', '/explore/tokens/1/0xabc')).toBe(
      false,
    )
  })

  it('treats a deep link as reached once its param is present', () => {
    expect(
      isDestinationAlreadyActive(
        '/explore/tokens/1/0xabc?modal=earn-vault',
        '/explore/tokens/1/0xabc?modal=earn-vault',
      ),
    ).toBe(true)
    expect(
      isDestinationAlreadyActive(
        '/explore/tokens/1/0xabc?modal=earn-vault',
        '/explore/tokens/1/0xabc?utm_source=blog&modal=earn-vault',
      ),
    ).toBe(true)
  })

  it('compares param values, not just names', () => {
    expect(isDestinationAlreadyActive('/explore?modal=earn-vault', '/explore?modal=something-else')).toBe(false)
  })

  it('requires the same path', () => {
    expect(isDestinationAlreadyActive('/explore', '/positions?utm_source=blog')).toBe(false)
  })

  it('ignores a trailing slash on either side', () => {
    expect(isDestinationAlreadyActive('/explore/', '/explore?utm_source=blog')).toBe(true)
    expect(isDestinationAlreadyActive('/explore', '/explore/')).toBe(true)
  })

  it('treats the hash like a param: required when the destination carries one, ignored otherwise', () => {
    expect(isDestinationAlreadyActive('/pool#faq', '/pool')).toBe(false)
    expect(isDestinationAlreadyActive('/pool#faq', '/pool#faq')).toBe(true)
    expect(isDestinationAlreadyActive('/pool', '/pool#faq')).toBe(true)
  })

  it('is false when either side is unparseable', () => {
    const originalLocation = window.location
    Object.defineProperty(window, 'location', { value: { origin: 'null' }, writable: true })

    expect(isDestinationAlreadyActive('/explore', '/explore')).toBe(false)

    Object.defineProperty(window, 'location', { value: originalLocation, writable: true })
  })
})
