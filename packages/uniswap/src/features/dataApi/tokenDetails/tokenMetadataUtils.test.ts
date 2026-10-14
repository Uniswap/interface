import { normalizeTwitterHandle } from 'uniswap/src/features/dataApi/tokenDetails/tokenMetadataUtils'

describe(normalizeTwitterHandle, () => {
  it.each([
    ['bare handle', 'bonk_inu', 'bonk_inu'],
    ['@-prefixed handle', '@bonk_inu', 'bonk_inu'],
    ['surrounding whitespace', '  bonk_inu  ', 'bonk_inu'],
    ['x.com profile URL', 'https://x.com/bonk_inu', 'bonk_inu'],
    ['twitter.com profile URL', 'https://twitter.com/bonk_inu', 'bonk_inu'],
    ['www + http URL', 'http://www.x.com/bonk_inu', 'bonk_inu'],
    ['uppercase domain', 'HTTPS://X.COM/bonk_inu', 'bonk_inu'],
    ['protocol-less URL', 'x.com/bonk_inu', 'bonk_inu'],
    ['trailing slash', 'https://x.com/bonk_inu/', 'bonk_inu'],
    ['query tail', 'https://x.com/bonk_inu?ref=abc', 'bonk_inu'],
    ['hash tail', 'https://x.com/bonk_inu#top', 'bonk_inu'],
    ['deep profile path', 'https://x.com/bonk_inu/status/123', 'bonk_inu'],
  ])('extracts the handle from a %s', (_case, input, expected) => {
    expect(normalizeTwitterHandle(input)).toBe(expected)
  })

  // Invalid inputs must resolve to undefined so consumers hide the link instead of building a broken URL
  it.each([
    ['undefined', undefined],
    ['empty string', ''],
    ['non-X domain URL', 'https://example.com/bonk_inu'],
    ['unhandled subdomain', 'https://mobile.twitter.com/bonk_inu'],
    ['handle over 15 chars', 'a'.repeat(16)],
    ['disallowed characters', 'bonk-inu'],
    ['free text', 'not a handle'],
  ])('returns undefined for %s', (_case, input) => {
    expect(normalizeTwitterHandle(input)).toBeUndefined()
  })
})
