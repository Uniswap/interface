import { Percent } from '@uniswap/sdk-core'
import { type DiscriminatedQuoteResponse } from '@universe/api'
import { SwapFee } from 'uniswap/src/features/transactions/swap/types/trade'
import { isWrap } from 'uniswap/src/features/transactions/swap/utils/routing'
import { CurrencyField } from 'uniswap/src/types/currency'
import { logger } from 'utilities/src/logger/logger'

export function getTradingApiSwapFee(quoteResponse?: DiscriminatedQuoteResponse): SwapFee | undefined {
  if (!quoteResponse || isWrap(quoteResponse)) {
    return undefined
  }

  const { quote } = quoteResponse

  const aggregatedOutputs = 'aggregatedOutputs' in quote ? quote.aggregatedOutputs : undefined
  const swapper = 'swapper' in quote ? quote.swapper : undefined

  // TODO(WALL-5756): remove this once the Trading API adds `aggregatedOuputs` to all quote types.
  if (!aggregatedOutputs || !swapper) {
    if (!quote.portionAmount || !quote.portionBips) {
      return undefined
    }

    return {
      recipient: quote.portionRecipient,
      percent: new Percent(quote.portionBips, '10000'),
      amount: quote.portionAmount,
      feeField: CurrencyField.OUTPUT,
    }
  }

  // In the UL frontend, there should always be a single fee,
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
    percent: new Percent(ulFee.bps, '10000'),
    amount: ulFee.amount,
    feeField: CurrencyField.OUTPUT,
  }
}
