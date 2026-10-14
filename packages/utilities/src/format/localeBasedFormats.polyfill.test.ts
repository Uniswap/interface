import { NumberFormat as PolyfillNumberFormat } from '@formatjs/intl-numberformat'
import { formatNumber } from 'utilities/src/format/localeBased'
import { clearNumberFormatCache } from 'utilities/src/format/localeBasedFormats'
import { NumberType } from 'utilities/src/format/types'

// Android force-installs this polyfill (apps/mobile/src/polyfills/intl.js). It rejects option sets
// V8 accepts, e.g. maximumFractionDigits: 0 without minimumFractionDigits: 0 on a 2-decimal currency.
describe('fiat token stats under the Android Intl.NumberFormat polyfill', () => {
  beforeAll(async () => {
    vi.stubGlobal('Intl', Object.create(Intl, { NumberFormat: { value: PolyfillNumberFormat } }))
    // Registers itself through the (now polyfilled) global Intl.NumberFormat.
    await import('@formatjs/intl-numberformat/locale-data/en')
    clearNumberFormatCache()
  })

  afterAll(() => {
    vi.unstubAllGlobals()
    clearNumberFormatCache()
  })

  it.each(['USD', 'EUR', 'GBP', 'JPY', 'VND'])(
    'formats every FiatTokenStats rule in %s without throwing',
    (currencyCode) => {
      for (const input of [0.001, 1.23, 234_567, 1e30]) {
        expect(() =>
          formatNumber({ input, type: NumberType.FiatTokenStats, locale: 'en-US', currencyCode }),
        ).not.toThrow()
      }
    },
  )

  it('renders the cap with a greater-than prefix', () => {
    expect(formatNumber({ input: 1e30, type: NumberType.FiatTokenStats, locale: 'en-US' })).toMatch(/^>\$/)
  })
})
