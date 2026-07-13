import { type Currency, type CurrencyAmount } from '@uniswap/sdk-core'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { logger } from 'utilities/src/logger/logger'

// Nodes report gas fees in 18-decimal native units. On chains that pay gas in a
// non-native ERC-20 "override" token with fewer decimals (e.g. Tempo pathUSD or
// Arc USDC, both 6 decimals), the fee must be shifted down by
// 10^(18 - gasTokenDecimals) to be expressed in the gas token's units.
const GAS_FEE_REPORTING_DECIMALS = 18

/**
 * True when the chain pays gas in a non-native override token (e.g. Tempo pathUSD,
 * Arc USDC) rather than the native currency.
 */
export function hasShiftedGasToken(chainId: UniverseChainId): boolean {
  return getChainInfo(chainId).gasTokenOverride !== undefined
}

/**
 * Decimal shift to convert an 18-decimal native gas fee into the chain's gas-token
 * units. Returns 1n (a no-op) for chains that pay gas in the native currency.
 */
export function getGasFeeDecimalsShift(chainId: UniverseChainId): bigint {
  const gasTokenOverride = getChainInfo(chainId).gasTokenOverride
  if (!gasTokenOverride) {
    return BigInt(1)
  }
  return BigInt(10) ** BigInt(GAS_FEE_REPORTING_DECIMALS - gasTokenOverride.decimals)
}

/**
 * Check whether the gas-token balance covers the gas fee (and optional transaction
 * amount) on a chain that pays gas in a non-native shifted token.
 *
 * The 18-decimal native gas fee is converted to the gas token's units via ceiling
 * division by `decimalShift`. When the user is also spending the gas token in the
 * transaction itself (e.g. sending or swapping pathUSD/USDC), pass
 * `gasTokenTransactionAmount` so the check accounts for both.
 */
export function hasSufficientFundsIncludingShiftedGasToken({
  gasTokenBalance,
  gasFee,
  gasTokenTransactionAmount,
  decimalShift,
}: {
  gasTokenBalance: CurrencyAmount<Currency> | undefined
  gasFee: string | undefined
  gasTokenTransactionAmount?: CurrencyAmount<Currency>
  decimalShift: bigint
}): boolean {
  if (!gasTokenBalance || !gasFee) {
    return false
  }

  try {
    // Convert the 18-decimal native gas fee to the gas token's units. Ceiling
    // division ensures even very small fees require at least 1 unit of the gas
    // token, so the check never under-reserves.
    const gasFeeInGasToken = (BigInt(gasFee) + decimalShift - BigInt(1)) / decimalShift
    const txAmount = gasTokenTransactionAmount ? BigInt(gasTokenTransactionAmount.quotient.toString()) : BigInt(0)
    const balance = BigInt(gasTokenBalance.quotient.toString())
    return balance >= gasFeeInGasToken + txAmount
  } catch {
    logger.error(new Error('Failed to convert gas fee to gas-token units'), {
      tags: {
        file: 'gas/shiftedGasToken.ts',
        function: 'hasSufficientFundsIncludingShiftedGasToken',
      },
      extra: {
        gasFee,
        gasTokenBalance,
      },
    })
    return false
  }
}

/**
 * Convert an 18-decimal native gas fee to the gas token's units for display, using
 * ceiling division by `decimalShift`.
 */
export function convertShiftedGasFeeForDisplay(gasFeeRaw: string, decimalShift: bigint): string {
  const converted = (BigInt(gasFeeRaw) + decimalShift - BigInt(1)) / decimalShift
  return converted.toString()
}
