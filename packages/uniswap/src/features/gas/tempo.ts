import { type Currency, type CurrencyAmount } from '@uniswap/sdk-core'
import { logger } from 'utilities/src/logger/logger'

// Conversion factor from 18-decimal native gas units to 6-decimal pathUSD
export const TEMPO_GAS_FEE_DECIMALS_SHIFT = BigInt(10) ** BigInt(12)

/**
 * Check whether pathUSD balance covers the gas fee (and optional transaction amount) on Tempo.
 *
 * Tempo has no native gas token — gas is paid in pathUSD. This converts the
 * 18-decimal gas fee to 6-decimal pathUSD units and compares against the balance.
 * When the user is also spending pathUSD in the transaction itself (e.g. sending or
 * swapping pathUSD), pass `pathUsdTransactionAmount` so the check accounts for both.
 */
export function hasSufficientFundsIncludingTempoGas({
  pathUsdBalance,
  gasFee,
  pathUsdTransactionAmount,
}: {
  pathUsdBalance: CurrencyAmount<Currency> | undefined
  gasFee: string | undefined
  pathUsdTransactionAmount?: CurrencyAmount<Currency>
}): boolean {
  if (!pathUsdBalance || !gasFee) {
    return false
  }

  try {
    // Convert 18-decimal native gas fee to 6-decimal pathUSD.
    // Tempo's node reports gas fees in "attodollars" (10^-18 USD). pathUSD is a
    // 6-decimal token, so the last 12 digits are always zero-padded and the
    // division is exact. Ceiling division future-proofs the logic in case that
    // assumption changes, ensuring even very small fees require at least
    // 0.000001 pathUSD balance.
    const gasFeeInPathUsd = (BigInt(gasFee) + TEMPO_GAS_FEE_DECIMALS_SHIFT - BigInt(1)) / TEMPO_GAS_FEE_DECIMALS_SHIFT
    const txAmount = pathUsdTransactionAmount ? BigInt(pathUsdTransactionAmount.quotient.toString()) : BigInt(0)
    const balance = BigInt(pathUsdBalance.quotient.toString())
    return balance >= gasFeeInPathUsd + txAmount
  } catch {
    logger.error(new Error('Failed to convert gas fee to pathUSD units'), {
      tags: {
        file: 'gas/tempo.ts',
        function: 'hasSufficientFundsIncludingTempoGas',
      },
      extra: {
        gasFee,
        pathUsdBalance,
      },
    })
    return false
  }
}

/**
 * Convert an 18-decimal attodollar gas fee to 6-decimal pathUSD units for display.
 */
export function convertTempoGasFeeForDisplay(gasFeeRaw: string): string {
  const converted = (BigInt(gasFeeRaw) + TEMPO_GAS_FEE_DECIMALS_SHIFT - BigInt(1)) / TEMPO_GAS_FEE_DECIMALS_SHIFT
  return converted.toString()
}
