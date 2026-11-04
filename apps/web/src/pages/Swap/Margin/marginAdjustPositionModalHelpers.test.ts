import { NumberType } from 'utilities/src/format/types'
import { describe, expect, it } from 'vitest'
import {
  clampLeverage,
  clampManageLeverage,
  computeGasDisplay,
  computeIsBeforeAfterDimmed,
  computeIsEditStale,
  computeShowInitialSkeleton,
} from '~/pages/Swap/Margin/marginAdjustPositionModalHelpers'
import { MANAGE_MIN_LEVERAGE } from '~/pages/Swap/Margin/marginOpenButtonGate'

describe('computeIsEditStale', () => {
  it('is stale while the debounce is still counting down', () => {
    expect(computeIsEditStale({ isDebouncing: true, isPlaceholderData: false })).toBe(true)
  })

  it('is stale while bridging a keepPreviousData placeholder quote', () => {
    expect(computeIsEditStale({ isDebouncing: false, isPlaceholderData: true })).toBe(true)
  })

  it('is settled once neither is true — the ~20s background refetch never sets either', () => {
    expect(computeIsEditStale({ isDebouncing: false, isPlaceholderData: false })).toBe(false)
  })
})

describe('computeIsBeforeAfterDimmed', () => {
  it('dims on an edit transition alone', () => {
    expect(computeIsBeforeAfterDimmed({ isEditStale: true, hasQuoteError: false })).toBe(true)
  })

  it('dims on a quote error alone — the latched-quote-under-error case', () => {
    expect(computeIsBeforeAfterDimmed({ isEditStale: false, hasQuoteError: true })).toBe(true)
  })

  it('does not dim once settled with no error', () => {
    expect(computeIsBeforeAfterDimmed({ isEditStale: false, hasQuoteError: false })).toBe(false)
  })
})

describe('computeShowInitialSkeleton', () => {
  it('shows while the first quote is in flight and nothing has landed yet', () => {
    expect(
      computeShowInitialSkeleton({
        hasQuote: false,
        hasLastGoodQuote: false,
        isQuoteLoading: true,
        isDebouncing: false,
      }),
    ).toBe(true)
    expect(
      computeShowInitialSkeleton({
        hasQuote: false,
        hasLastGoodQuote: false,
        isQuoteLoading: false,
        isDebouncing: true,
      }),
    ).toBe(true)
  })

  it('hides once a quote (or a latched last-good one) exists, even mid-refetch', () => {
    expect(
      computeShowInitialSkeleton({
        hasQuote: true,
        hasLastGoodQuote: false,
        isQuoteLoading: true,
        isDebouncing: false,
      }),
    ).toBe(false)
    expect(
      computeShowInitialSkeleton({
        hasQuote: false,
        hasLastGoodQuote: true,
        isQuoteLoading: true,
        isDebouncing: false,
      }),
    ).toBe(false)
  })

  it('hides once neither loading nor debouncing, even with nothing landed (e.g. a disabled query)', () => {
    expect(
      computeShowInitialSkeleton({
        hasQuote: false,
        hasLastGoodQuote: false,
        isQuoteLoading: false,
        isDebouncing: false,
      }),
    ).toBe(false)
  })
})

describe('clampLeverage', () => {
  it.each([
    { leverage: 0.5, expected: 1.1 },
    { leverage: 3, expected: 3 },
    { leverage: 9, expected: 5.7 },
  ])('bounds $leverage to $expected within [1.1, 5.7]', ({ leverage, expected }) => {
    expect(clampLeverage({ leverage, min: 1.1, max: 5.7 })).toBe(expected)
  })

  it('imposes no ceiling while max is unknown', () => {
    expect(clampLeverage({ leverage: 9, min: 1.1, max: undefined })).toBe(9)
  })
})

describe('clampManageLeverage', () => {
  it('holds a chosen value inside the venue ceiling', () => {
    expect(clampManageLeverage({ leverage: 9, venueCap: 4 })).toBe(4)
  })

  it('floors at the manage minimum, which sits above the backend’s exclusive 1.0 bound', () => {
    expect(clampManageLeverage({ leverage: 1, venueCap: 4 })).toBe(MANAGE_MIN_LEVERAGE)
  })

  // The reason the ceiling is the PUBLISHED one: `cap` floors to MIN_LEVERAGE where none is published,
  // so bounding there would snap every chosen value to 1.10x with no way back.
  it('imposes no ceiling when the market publishes none', () => {
    expect(clampManageLeverage({ leverage: 9, venueCap: undefined })).toBe(9)
  })
})

// The adjust modals' network-cost row. The open flow's twin reads these two fields through the same
// guarded decoders; this path had neither, and no test, so the gap survived the fix that landed there.
describe('computeGasDisplay', () => {
  const formatNumberOrString = ({ value, type }: { value: number; type: NumberType }): string =>
    `${type === NumberType.FiatGasPrice ? '$' : ''}${value.toFixed(2)}`

  it('reports the USD figure when the server priced it', () => {
    expect(
      computeGasDisplay({
        gasEstimate: { gasLimit: '200000', gasFeeWei: '2100000000000000', gasFeeUsd: `${7n * 10n ** 18n}` },
        formatNumberOrString,
      }),
    ).toBe('$7.00')
  })

  // '0' is the wire's "could not price", not a free transaction — and it is a truthy STRING, so a bare
  // `if (gasFeeUsd)` renders $0.00 and hides the real cost that is sitting in gasFeeWei.
  it('falls through to the ETH figure on the zero-USD sentinel rather than reporting $0.00', () => {
    expect(
      computeGasDisplay({
        gasEstimate: { gasLimit: '200000', gasFeeWei: '2100000000000000', gasFeeUsd: '0' },
        formatNumberOrString,
      }),
    ).toBe('0.00210 ETH')
  })

  // A bare BigInt() throws a SyntaxError on a non-integer, which would unwind the whole modal.
  it('reports nothing, rather than throwing, on wire values that are not integers', () => {
    expect(
      computeGasDisplay({
        gasEstimate: { gasLimit: '200000', gasFeeWei: '1.5', gasFeeUsd: '2.5' },
        formatNumberOrString,
      }),
    ).toBeUndefined()
  })

  it('reports nothing when the quote carries no gas estimate at all', () => {
    expect(computeGasDisplay({ gasEstimate: undefined, formatNumberOrString })).toBeUndefined()
  })
})
