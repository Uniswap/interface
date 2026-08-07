import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { formatMultiTokenSymbols } from '~/pages/Portfolio/Activity/ActivityTable/ActivityAmountCell/MultiTokenLayout'

function currencyInfoFixture(symbol: string): CurrencyInfo {
  return { currencyId: `1-${symbol}`, currency: { symbol } } as unknown as CurrencyInfo
}

describe('formatMultiTokenSymbols', () => {
  it('joins the symbols of a small set', () => {
    expect(formatMultiTokenSymbols([currencyInfoFixture('UNI'), currencyInfoFixture('USDC')])).toBe('UNI, USDC')
  })

  it('renders a single symbol without a separator', () => {
    expect(formatMultiTokenSymbols([currencyInfoFixture('UNI')])).toBe('UNI')
  })

  it('caps the list at three symbols and counts the remainder', () => {
    const symbols = ['UNI', 'USDC', 'DAI', 'WBTC', 'LINK'].map(currencyInfoFixture)

    expect(formatMultiTokenSymbols(symbols)).toBe('UNI, USDC, DAI +2')
  })

  it('returns an empty string for no currencies', () => {
    expect(formatMultiTokenSymbols([])).toBe('')
  })

  // A claim's unresolved tokens are filtered out before this runs, so without the real total the
  // "+N" would count only resolved ones and quietly under-report the claim.
  it('counts the remainder against the claim total, not just the resolved currencies', () => {
    const resolved = ['UNI', 'USDC', 'DAI'].map(currencyInfoFixture)

    expect(formatMultiTokenSymbols(resolved, 5)).toBe('UNI, USDC, DAI +2')
  })

  it('reports a remainder even when every shown currency resolved', () => {
    expect(formatMultiTokenSymbols([currencyInfoFixture('UNI')], 2)).toBe('UNI +1')
  })

  it('omits a resolved currency with no symbol instead of emitting a stray separator', () => {
    const currencies = [currencyInfoFixture('UNI'), currencyInfoFixture(''), currencyInfoFixture('DAI')]

    expect(formatMultiTokenSymbols(currencies)).toBe('UNI, DAI')
  })

  it('leads with the remainder when nothing shown had a symbol', () => {
    expect(formatMultiTokenSymbols([], 2)).toBe('+2')
    expect(formatMultiTokenSymbols([currencyInfoFixture('')], 2)).toBe('+1')
  })
})
