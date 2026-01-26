import { BigNumber } from '@ethersproject/bignumber'
import { GasFeeResult } from 'uniswap/src/features/gas/types'

export function sumGasFees(gasFees: (string | undefined)[]): string | undefined {
  if (gasFees.length === 0) {
    return undefined
  }
  return gasFees.reduce((acc, gasFee) => {
    return BigNumber.from(acc)
      .add(BigNumber.from(gasFee || '0'))
      .toString()
  }, '0')
}

/**
 * Merges multiple GasFeeResult objects into a single result by combining their values and preserving error/loading states
 *
 * @param gasFeeResults - Array of GasFeeResult objects to merge
 * @returns {GasFeeResult} A single merged GasFeeResult where:
 *   - error: First encountered error or null if no errors
 *   - isLoading: true if any result is loading
 *   - value: Sum of all values (undefined if any result has error or missing value)
 *   - displayValue: Sum of all display values (undefined if any result has error or missing value)
 */
export function mergeGasFeeResults(...gasFeeResults: GasFeeResult[]): GasFeeResult {
  // Filter out "Approval action unknown" errors - these are informational and shouldn't block swap
  // Also filter out empty objects and empty Error instances
  const meaningfulErrors = gasFeeResults
    .map((g) => g.error)
    .filter((e) => {
      if (!e) return false
      if (e instanceof Error) {
        // Filter out empty Error objects and "Approval action unknown" errors
        if (!e.message || e.message.length === 0) return false
        if (e.message === 'Approval action unknown') return false
        return true
      }
      if (typeof e === 'object' && Object.keys(e).length > 0) return true
      // Empty object {} should be filtered out
      return false
    })

  // Use the first meaningful error, or null if none
  const error = meaningfulErrors[0] ?? null

  const isLoading = gasFeeResults.some((r) => r.isLoading)

  // Only consider value missing if it's missing AND there's a meaningful error
  // If value is missing but error is null (or filtered out), we can still proceed if other results have values
  const resultsWithValues = gasFeeResults.filter((r) => r.value !== undefined)
  const expectedValueMissing = resultsWithValues.length === 0 && error !== null

  if (expectedValueMissing || error) {
    return { value: undefined, displayValue: undefined, error, isLoading }
  }

  // Sum only the values that are defined
  const value = sumGasFees(gasFeeResults.map((r) => r.value))
  const displayValue = sumGasFees(gasFeeResults.map((r) => r.displayValue))
  return { value, displayValue, error, isLoading }
}
