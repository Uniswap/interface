import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { type Currency, CurrencyAmount } from '@uniswap/sdk-core'
import type { LiquidityServicePosition, PositionInfo } from 'uniswap/src/features/positions/types'
import { logger } from 'utilities/src/logger/logger'

type ParsedUncollectedFees = Pick<
  PositionInfo,
  | 'token0UncollectedFees'
  | 'token1UncollectedFees'
  | 'fee0Amount'
  | 'fee1Amount'
  | 'uncollectedFeesUsd'
  | 'token0UncollectedFeesUsd'
  | 'token1UncollectedFeesUsd'
>

const NO_UNCOLLECTED_FEES: ParsedUncollectedFees = {
  token0UncollectedFees: undefined,
  token1UncollectedFees: undefined,
  fee0Amount: undefined,
  fee1Amount: undefined,
  uncollectedFeesUsd: undefined,
  token0UncollectedFeesUsd: undefined,
  token1UncollectedFeesUsd: undefined,
}

// Per-token fee USD, priced with the SAME backend token price used for the total
// `uncollectedFeesUsd`, so a per-token breakdown sums back to that total. This is
// why the PDP must not re-price fees with a live oracle (which diverges from the
// backend and makes the detail page disagree with the positions list). LP-1616.
function perTokenFeeUsd(
  feeAmount: CurrencyAmount<Currency> | undefined,
  priceUsd: string | undefined,
): number | undefined {
  if (!feeAmount || priceUsd === undefined) {
    return undefined
  }
  const price = Number(priceUsd)
  if (!Number.isFinite(price)) {
    return undefined
  }
  return Number(feeAmount.toExact()) * price
}

// A malformed raw string (non-integer, over MaxUint256) throws in the SDK; that's a fee-only data
// problem, so it degrades this field rather than dropping the position in the parser's outer catch.
function safeFromRawAmount(currency: Currency, rawAmount: string): CurrencyAmount<Currency> | undefined {
  try {
    return CurrencyAmount.fromRawAmount(currency, rawAmount)
  } catch {
    logger.warn(
      'positions/parseLiquidityServiceValuation.ts',
      'safeFromRawAmount',
      'Unparseable uncollected fee amount',
      { rawAmount, currency: currency.symbol },
    )
    return undefined
  }
}

// Degraded rows skip the CurrencyAmounts: the placeholder tokens' decimals are made up, so a
// human-readable fee amount built from them would be wrong rather than merely missing. The raw
// strings and the USD figure are decimals-independent and pass through regardless.
export function parseUncollectedFees({
  position,
  version,
  token0,
  token1,
  hasTokenIdentity,
}: {
  position: LiquidityServicePosition
  version: ProtocolVersion
  token0: Currency
  token1: Currency
  hasTokenIdentity: boolean
}): ParsedUncollectedFees {
  // V2 pair fees compound into the reserves; a pair never has collectable fee fields.
  if (version === ProtocolVersion.V2) {
    return NO_UNCOLLECTED_FEES
  }
  const { token0UncollectedFees, token1UncollectedFees } = position
  const fee0Amount =
    hasTokenIdentity && token0UncollectedFees !== undefined
      ? safeFromRawAmount(token0, token0UncollectedFees)
      : undefined
  const fee1Amount =
    hasTokenIdentity && token1UncollectedFees !== undefined
      ? safeFromRawAmount(token1, token1UncollectedFees)
      : undefined
  return {
    token0UncollectedFees,
    token1UncollectedFees,
    fee0Amount,
    fee1Amount,
    uncollectedFeesUsd: position.uncollectedFeesUsd,
    token0UncollectedFeesUsd: perTokenFeeUsd(fee0Amount, position.token0PriceUsd),
    token1UncollectedFeesUsd: perTokenFeeUsd(fee1Amount, position.token1PriceUsd),
  }
}
