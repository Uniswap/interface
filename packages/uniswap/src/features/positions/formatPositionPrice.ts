import type { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'
import { formatNumberWithSubscript } from 'utilities/src/format/subscriptNotation'
import { NumberType } from 'utilities/src/format/types'

// Below this, TokenTx's five-decimal rules collapse distinct prices into "<0.00001"/"0.00001";
// subscript notation (e.g. 0.0₅123) keeps them readable and comparable. Matches the threshold
// used by the liquidity chart tick tooltips.
const SUBSCRIPT_PRICE_THRESHOLD = 0.001

// Every value that reaches the subscript branch is < SUBSCRIPT_PRICE_THRESHOLD, i.e. has at least
// 3 leading decimal zeros. Matching the leading-zero threshold to that guarantees all small prices
// render in subscript notation (e.g. 0.0₃21), instead of the previous mix where 3-leading-zero
// values (0.00021) fell back to low-precision plain decimals while their neighbours used subscript.
const SUBSCRIPT_LEADING_ZERO_THRESHOLD = 3

/**
 * Formats a token-denominated price for position surfaces (rate header, price range cards),
 * falling back to Unicode subscript notation for tiny prices instead of the TokenTx floor.
 */
export function formatPositionPrice({
  value,
  locale,
  formatNumberOrString,
}: {
  value: Maybe<number | string>
  locale: string
  formatNumberOrString: LocalizationContextState['formatNumberOrString']
}): string {
  const numericValue = typeof value === 'string' ? Number(value) : value
  if (
    numericValue !== null &&
    numericValue !== undefined &&
    Number.isFinite(numericValue) &&
    numericValue > 0 &&
    numericValue < SUBSCRIPT_PRICE_THRESHOLD
  ) {
    return formatNumberWithSubscript({
      value: numericValue,
      locale,
      subscriptThreshold: SUBSCRIPT_LEADING_ZERO_THRESHOLD,
    })
  }
  return formatNumberOrString({ value, type: NumberType.TokenTx })
}
