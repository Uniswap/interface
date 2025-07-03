import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { TradeType, Urgency } from 'uniswap/src/data/tradingApi/__generated__'
import { GasStrategy } from 'uniswap/src/data/tradingApi/types'
import { getActiveGasStrategy } from 'uniswap/src/features/gas/hooks'
import { isZeroAmount } from 'uniswap/src/features/transactions/swap/hooks/useTrade/determineSwapCurrenciesAndStaticArgs'
import {
  SWAP_GAS_URGENCY_OVERRIDE,
  createGetQuoteRoutingParams,
  createGetQuoteSlippageParams,
  getTokenAddressForApi,
  type QuoteRoutingParamsResult,
  type QuoteSlippageParamsResult,
} from 'uniswap/src/features/transactions/swap/utils/tradingApi'

// The TradingAPI requires an address for the swapper field; we supply a placeholder address if no account is connected.
// Note: This address was randomly generated.
const UNCONNECTED_ADDRESS = '0xAAAA44272dc658575Ba38f43C438447dDED45358'

export type GetQuoteRequestArgs = {
  currencyIn: Maybe<Currency>
  currencyOut: Maybe<Currency>
  amount: Maybe<CurrencyAmount<Currency>>
  generatePermitAsTransaction?: boolean
  isUSDQuote?: boolean
  activeAccountAddress: string | undefined
  tokenInAddress?: string
  tokenInChainId?: number
  tokenOutAddress?: string
  tokenOutChainId?: number
  requestTradeType: TradeType
}

export type GetQuoteRequestResult = {
  amount: string
  generatePermitAsTransaction?: boolean
  gasStrategies: GasStrategy[]
  isUSDQuote?: boolean
  swapper: string
  tokenIn: string
  tokenInChainId: number
  tokenOut: string
  tokenOutChainId: number
  type: TradeType
  urgency?: Urgency
} & QuoteRoutingParamsResult &
  QuoteSlippageParamsResult

export type GetQuoteRequestArgsGetter = (input: GetQuoteRequestArgs) => GetQuoteRequestResult | undefined

export function createGetQuoteRequestArgs(ctx: {
  getShouldSkip: () => boolean
  getRoutingParams: ReturnType<typeof createGetQuoteRoutingParams>
  getSlippageParams: ReturnType<typeof createGetQuoteSlippageParams>
}): GetQuoteRequestArgsGetter {
  const { getShouldSkip, getRoutingParams, getSlippageParams } = ctx

  return (input: GetQuoteRequestArgs) => {
    const tokenInAddress = getTokenAddressForApi(input.currencyIn)
    const tokenOutAddress = getTokenAddressForApi(input.currencyOut)

    if (
      getShouldSkip() ||
      !tokenInAddress ||
      !tokenOutAddress ||
      !input.tokenInChainId ||
      !input.tokenOutChainId ||
      !input.amount ||
      isZeroAmount(input.amount)
    ) {
      return undefined
    }

    return {
      amount: input.amount.quotient.toString(),
      generatePermitAsTransaction: input.generatePermitAsTransaction,
      gasStrategies: [getActiveGasStrategy({ chainId: input.tokenInChainId, type: 'swap' })],
      isUSDQuote: input.isUSDQuote,
      swapper: input.activeAccountAddress ?? UNCONNECTED_ADDRESS,
      tokenIn: tokenInAddress,
      tokenInChainId: input.tokenInChainId,
      tokenOut: tokenOutAddress,
      tokenOutChainId: input.tokenOutChainId,
      type: input.requestTradeType,
      urgency: SWAP_GAS_URGENCY_OVERRIDE,
      ...getRoutingParams({
        tokenInChainId: input.tokenInChainId,
        tokenOutChainId: input.tokenOutChainId,
        isUSDQuote: input.isUSDQuote,
      }),
      ...getSlippageParams({
        tokenInChainId: input.tokenInChainId,
        tokenOutChainId: input.tokenOutChainId,
        isUSDQuote: input.isUSDQuote,
      }),
    }
  }
}
