import fs from 'fs'
import { getOnRampRedirectUrl, ON_RAMP_RETURN_PATH } from '~/pages/Swap/Buy/onRampRedirectUrl'

const ORIGIN = 'https://app.uniswap.org'

describe('getOnRampRedirectUrl', () => {
  it('returns the buy page on desktop web', () => {
    expect(getOnRampRedirectUrl({ origin: ORIGIN, isMobileWebBrowser: false })).toBe('https://app.uniswap.org/buy')
  })

  it('returns the app-link-safe return path on mobile web', () => {
    expect(getOnRampRedirectUrl({ origin: ORIGIN, isMobileWebBrowser: true })).toBe(
      'https://app.uniswap.org/onramp-return',
    )
  })
})

/** Converts an AASA component path pattern (`*` = any substring, `?` = one char) to a RegExp. */
function appleComponentPatternToRegExp(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.')
  return new RegExp(`^${escaped}$`)
}

// Guards that the mobile-web return path stays outside every path the native apps claim
// as a universal/app link — otherwise the OS opens the native app on the post-onramp
// redirect instead of returning to the mobile-web session.
describe(`${ON_RAMP_RETURN_PATH} is not claimed by the native apps`, () => {
  it('is not matched by any iOS AASA applinks component', () => {
    const aasa = JSON.parse(fs.readFileSync('./public/.well-known/apple-app-site-association', 'utf8')) as {
      applinks: { details: { components: Record<string, unknown>[] }[] }
    }
    const pathPatterns = aasa.applinks.details
      .flatMap((detail) => detail.components.map((component) => component['/']))
      .filter((pattern): pattern is string => typeof pattern === 'string')

    // sanity-check the matcher against a path iOS does claim
    expect(pathPatterns.some((pattern) => appleComponentPatternToRegExp(pattern).test('/buy/'))).toBe(true)

    for (const pattern of pathPatterns) {
      expect(appleComponentPatternToRegExp(pattern).test(ON_RAMP_RETURN_PATH)).toBe(false)
    }
  })

  it('is not under any Android app-link pathPrefix', () => {
    const manifest = fs.readFileSync('../mobile/android/app/src/main/AndroidManifest.xml', 'utf8')
    const pathPrefixes = [...manifest.matchAll(/android:pathPrefix="([^"]+)"/g)].flatMap((match) =>
      match[1] ? [match[1]] : [],
    )

    // sanity-check the extraction against a path Android does claim
    expect(pathPrefixes.some((prefix) => '/buy'.startsWith(prefix))).toBe(true)

    for (const prefix of pathPrefixes) {
      expect(ON_RAMP_RETURN_PATH.startsWith(prefix)).toBe(false)
    }
  })
})
