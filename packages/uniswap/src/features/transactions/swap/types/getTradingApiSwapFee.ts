import { Percent } from '@uniswap/sdk-core'
import { type DiscriminatedQuoteResponse } from '@universe/api'
import type { SwapFee } from 'uniswap/src/features/transactions/swap/types/trade'
import { isWrap } from 'uniswap/src/features/transactions/swap/utils/routing'
import { CurrencyField } from 'uniswap/src/types/currency'
import { logger } from 'utilities/src/logger/logger'

// Integrator fee basis points may be fractional (e.g. 12.5). `new Percent`
// rejects a non-integer numerator (sdk-core/JSBI throws), so for fractional bps
// scale by 100 and adjust the denominator: 12.5 -> 1250 / 1_000_000, identical in
// value to 12.5 / 10_000. Integer bps keep the original bips / 10_000 form.
function bipsToPercent(bips: number): Percent {
  return Number.isInteger(bips) ? new Percent(bips, 10_000) : new Percent(Math.round(bips * 100), 1_000_000)
}

export function getTradingApiSwapFee(quoteResponse?: DiscriminatedQuoteResponse): SwapFee | undefined {
  if (!quoteResponse || isWrap(quoteResponse)) {
    return undefined
  }

  const { quote } = quoteResponse

  const aggregatedOutputs = 'aggregatedOutputs' in quote ? quote.aggregatedOutputs : undefined
  const swapper = 'swapper' in quote ? quote.swapper : undefined

  // TODO(WALL-5756): remove this once the Trading API adds `aggregatedOuputs` to all quote types.
  if (!aggregatedOutputs || !swapper) {
    if (!('portionAmount' in quote) || !('portionBips' in quote) || !quote.portionAmount || !quote.portionBips) {
      return undefined
    }

    return {
      recipient: quote.portionRecipient,
      percent: bipsToPercent(quote.portionBips),
      amount: quote.portionAmount,
      feeField: CurrencyField.OUTPUT,
    }
  }

  // In the UL frontend, there should always at most 1 fee,
  // so we just need to look for the first fee where the output isn't going to the swapper address.

  const ulFees = aggregatedOutputs.filter((output) => output.recipient !== swapper)

  if (ulFees.length > 1) {
    logger.error(new Error('Multiple UL fees found in quote'), {
      tags: {
        file: 'getSwapFee.ts',
        function: 'getSwapFee',
      },
      extra: { ulFees, quote },
    })
  }

  const ulFee = ulFees[0]

  if (!ulFee?.bps || !ulFee.amount) {
    return undefined
  }

  return {
    recipient: ulFee.recipient,
    percent: bipsToPercent(ulFee.bps),
    amount: ulFee.amount,
    feeField: CurrencyField.OUTPUT,
  }
}
