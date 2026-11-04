import { NumberFormat as PolyfillNumberFormat } from '@formatjs/intl-numberformat'
import { parseForSubscriptNotation } from 'utilities/src/format/parseForSubscriptNotation'
import { subscriptDust } from 'utilities/src/format/subscriptDust'

// Android force-installs this polyfill (apps/mobile/src/polyfills/intl.js); separators must come
// from its formatToParts output too.
describe('subscript separators under the Android Intl.NumberFormat polyfill', () => {
  beforeAll(async () => {
    vi.stubGlobal('Intl', Object.create(Intl, { NumberFormat: { value: PolyfillNumberFormat } }))
    await import('@formatjs/intl-numberformat/locale-data/en')
    await import('@formatjs/intl-numberformat/locale-data/nl')
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('renders subscript dust with each locale decimal separator', () => {
    expect(subscriptDust(0.00001024, 'en-US')).toBe('0.0₄1024')
    expect(subscriptDust(0.00001024, 'nl-NL')).toBe('0,0₄1024')
  })

  it('builds fullFormatted with each locale decimal separator', () => {
    const params = { value: 0.00001024, minSigDigits: 2, maxSigDigits: 4, subscriptThreshold: 4 }
    expect(parseForSubscriptNotation({ ...params, locale: 'en-US' }).fullFormatted).toBe('0.041024')
    expect(parseForSubscriptNotation({ ...params, locale: 'nl-NL' }).fullFormatted).toBe('0,041024')
  })
})
