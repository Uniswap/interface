import { BigNumber } from '@ethersproject/bignumber'
import { Log } from '@ethersproject/providers'
import range from 'lodash/range'
import {
  MINIMUM_SWAP_LOG_LENGTH,
  TOLERANCE_INDEX,
} from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/getOutputAmountFromSwapLogAndFormData.ts/constants'
import {
  getDataWithoutPadding,
  getInputAmountIndices,
  slidingWindowRangeMatch,
} from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/getOutputAmountFromSwapLogAndFormData.ts/utils'
import { logger } from 'utilities/src/logger/logger'

/**
 * Attempts to recover the *actual* output token amount from a swap transaction’s
 * event logs, using the currency amounts from the swap form
 *
 * High-level flow:
 * 1.  Guard-clauses – bail if any of the form values are missing.
 * 2.  Filter logs to those that are large enough to contain both an input and
 *     an output amount (`MINIMUM_SWAP_LOG_LENGTH`).
 * 3.  Build an *expected range* for the output amount:
 *     - `outputLowBound`  = form output minus slippage (rounded ↓)
 *     - `outputHighBound` = form output plus slippage  (rounded ↑)
 * 4.  For every candidate log:
 *     4.1 Filter for the *input* amount inside the log (`getInputAmountIndices`)
 *          – Present in every on-chain Swap() event (regardless of contract)
 *          - After locating, we replace it with a string outside of the output amount range
 *               - This prevents a false blob candidate from the input, if it's in the output amount range (eg stablecoin swaps)
 *     4.2 Split the log into “blobs” of non-padding data
 *          (`getDataWithoutPadding`).  Split into blobs with metadata on position and signs
 *          (`isBlobPositive`, `isNextBlobPositive`, `isFirst`, `isLast`).
 *     4.3 For every blob inside a *reasonable* size window
 *          (`minHexOutputStringSize ± TOLERANCE_INDEX`) run
 *          `slidingWindowRangeMatch`, which:
 *          • pads the blob with plausible leading/trailing 0/f digits,
 *          • slides a window of every possible length across the padded
 *            string (`possibleLengths`),
 *          • converts each hex window to a BigNumber (abs-value),
 *          • returns the value if it lies within `[outputLowBound, outputHighBound]`.
 * 5.  If **exactly one** blob across all windows matches, return it –
 *     that’s our recovered on-chain output amount.  Any ambiguity or error
 *     returns `undefined` to ensure we don't show an incorrect balance to users
 *
 * @param inputAmountFromForm  Raw input amount (BN) typed in the form.
 * @param outputAmountFromForm Raw output amount (BN) displayed in the form.
 * @param slippageFromForm     Allowed slippage in percent (e.g. 1 = 1 %).
 * @param logs                 All logs emitted by the swap transaction.
 * @returns The output amount found in the logs, or `undefined` if none / ambiguous.
 */
export function getOutputAmountUsingSwapLogAndFormData({
  inputAmountFromForm,
  outputAmountFromForm,
  slippageFromForm,
  logs,
}: {
  inputAmountFromForm?: BigNumber
  outputAmountFromForm?: BigNumber
  slippageFromForm?: number
  logs: Log[]
}): BigNumber | undefined {
  if (!inputAmountFromForm || !outputAmountFromForm || !slippageFromForm) {
    return undefined
  }

  const logsOverLengthThreshold = logs.filter(({ data }) => data.length >= MINIMUM_SWAP_LOG_LENGTH)

  if (!logsOverLengthThreshold.length) {
    return undefined
  }

  // get range from presented output give or take slippage (rounded to nearest tenth)
  const outputLowBound = outputAmountFromForm.mul(Math.floor(10_000 - slippageFromForm * 100)).div(10_000)
  // high bound is technically infinite because of positive slippage but this works 99.99% of the time
  const outputHighBound = outputAmountFromForm.mul(Math.ceil(10_000 + slippageFromForm * 100)).div(10_000)

  // remove 0x prefix from each
  const minHexOutputStringSize = BigNumber.from(outputLowBound).toHexString().length - 2
  const maxHexOutputStringSize = BigNumber.from(outputHighBound).toHexString().length - 2

  for (const { data: logData } of logsOverLengthThreshold) {
    const inputAmountIndices = getInputAmountIndices({
      logData,
      inputAmount: inputAmountFromForm,
    })

    if (!inputAmountIndices) {
      continue
    }

    const { inputStartIndex, inputEndIndex, isInputPositive } = inputAmountIndices

    // replace the input to ensure it doesn't get picked up as an eligible output amount (eg USDT <-> USDC swaps)
    const logDataWithoutInput = `${logData.slice(0, inputStartIndex)}${'1'.repeat(maxHexOutputStringSize + 1)}${logData.slice(inputEndIndex + 1)}`

    try {
      const possibleValues = getDataWithoutPadding(logDataWithoutInput)
        .map((blob) => {
          const { blobData, isBlobPositive } = blob
          // if the input is negative, the output amount cannot be negative
          if (!isInputPositive && !isBlobPositive) {
            return undefined
          }

          // check if within a reasonable length
          if (
            blobData.length < minHexOutputStringSize - TOLERANCE_INDEX ||
            blobData.length > maxHexOutputStringSize + TOLERANCE_INDEX
          ) {
            return undefined
          }

          return slidingWindowRangeMatch({
            blob,
            outputHighBound,
            outputLowBound,
            possibleLengths: range(minHexOutputStringSize, maxHexOutputStringSize + 1, 1),
          })
        })
        .filter(Boolean)

      if (possibleValues.length === 1) {
        return possibleValues[0]
      }
    } catch (e) {
      logger.error(e, {
        tags: {
          file: 'getOutputAmountUsingSwapLogAndFormData.ts',
          function: 'getOutputAmountUsingSwapLogAndFormData',
        },
      })
      return undefined
    }
  }
  return undefined
}
