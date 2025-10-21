import type { DutchQuoteV2, DutchQuoteV3, PriorityQuote } from 'uniswap/src/data/tradingApi/__generated__'
import { SignTypedDataStepFields } from 'uniswap/src/features/transactions/steps/permit2Signature'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { ValidatedPermit } from 'uniswap/src/features/transactions/swap/utils/trade'

export interface UniswapXSignatureStep extends SignTypedDataStepFields {
  type: TransactionStepType.UniswapXSignature
  deadline: number
  quote: DutchQuoteV2 | DutchQuoteV3 | PriorityQuote
}

export function createSignUniswapXOrderStep(
  permitData: ValidatedPermit,
  quote: DutchQuoteV2 | DutchQuoteV3 | PriorityQuote,
): UniswapXSignatureStep {
  return { type: TransactionStepType.UniswapXSignature, deadline: quote.orderInfo.deadline, quote, ...permitData }
}
