import { loadIntlPolyfillsForLocale } from 'src/polyfills/intl-delayed'
import * as localeBasedFormats from 'utilities/src/format/localeBasedFormats'

vi.mock('uniswap/src/i18n/utils', () => ({
  getWalletDeviceLocale: vi.fn(() => 'en-US'),
}))

describe(loadIntlPolyfillsForLocale, () => {
  it('reloads locale data and invalidates the number format cache only when the locale changes', () => {
    const clearSpy = vi.spyOn(localeBasedFormats, 'clearNumberFormatCache')

    // First load has no previously-cached formatters to invalidate.
    loadIntlPolyfillsForLocale('es-ES')
    expect(clearSpy).not.toHaveBeenCalled()

    // Loading the same locale again is a no-op.
    loadIntlPolyfillsForLocale('es-ES')
    expect(clearSpy).not.toHaveBeenCalled()

    // Switching languages must invalidate the cache so formatters are rebuilt
    // with the newly loaded locale data (otherwise they keep the English fallback).
    loadIntlPolyfillsForLocale('fr-FR')
    expect(clearSpy).toHaveBeenCalledTimes(1)

    // Re-loading the now-current locale does not clear again.
    loadIntlPolyfillsForLocale('fr-FR')
    expect(clearSpy).toHaveBeenCalledTimes(1)

    clearSpy.mockRestore()
  })
})
