import { useMemo } from 'react'
import { isL2ChainId } from 'uniswap/src/features/chains/utils'
import type { GetQuoteRequestArgsGetter } from 'uniswap/src/features/transactions/swap/hooks/useTrade/createGetQuoteRequestArgs'
import {
  createGetQuoteRequestArgs,
  type GetQuoteRequestResult,
} from 'uniswap/src/features/transactions/swap/hooks/useTrade/createGetQuoteRequestArgs'
import {
  areCurrenciesEqual,
  determineSwapCurrenciesAndStaticArgs,
  isZeroAmount,
} from 'uniswap/src/features/transactions/swap/hooks/useTrade/determineSwapCurrenciesAndStaticArgs'
import { type UseTradeArgs } from 'uniswap/src/features/transactions/swap/types/trade'
import { DEFAULT_PROTOCOL_OPTIONS, useProtocolsForChain } from 'uniswap/src/features/transactions/swap/utils/protocols'
import {
  createGetQuoteRoutingParams,
  createGetQuoteSlippageParams,
  getMinAutoSlippageToleranceL2,
  getTokenAddressForApi,
  toTradingApiSupportedChainId,
} from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { useEvent } from 'utilities/src/react/hooks'

export function useQuoteRequestArgs(params: UseTradeArgs): GetQuoteRequestResult | undefined {
  const getQuoteRequestArgs = useGetQuoteRequestArgs(params)
  return useMemo(() => {
    const { currencyIn, currencyOut, requestTradeType } = determineSwapCurrenciesAndStaticArgs(params)
    return getQuoteRequestArgs({
      currencyIn,
      currencyOut,
      amount: params.amountSpecified,
      requestTradeType,
      activeAccountAddress: params.account?.address,
      tokenInChainId: toTradingApiSupportedChainId(currencyIn?.chainId),
      tokenOutChainId: toTradingApiSupportedChainId(currencyOut?.chainId),
      tokenInAddress: getTokenAddressForApi(currencyIn),
      tokenOutAddress: getTokenAddressForApi(currencyOut),
      generatePermitAsTransaction: params.generatePermitAsTransaction,
      isUSDQuote: params.isUSDQuote ?? false,
    })
  }, [params, getQuoteRequestArgs])
}

function useGetQuoteRequestArgs(params: UseTradeArgs): GetQuoteRequestArgsGetter {
  const { currencyIn } = determineSwapCurrenciesAndStaticArgs({
    tradeType: params.tradeType,
    amountSpecified: params.amountSpecified,
    otherCurrency: params.otherCurrency,
  })

  /***** Format request arguments ******/
  const protocols = useProtocolsForChain(params.selectedProtocols ?? DEFAULT_PROTOCOL_OPTIONS, currencyIn?.chainId)

  return useEvent((input) => {
    const getRoutingParams = createGetQuoteRoutingParams({
      getProtocols: () => protocols,
      getIsV4HookPoolsEnabled: () => params.isV4HookPoolsEnabled ?? true,
    })

    const getSlippageParams = createGetQuoteSlippageParams({
      getIsL2ChainId: (chainId) => isL2ChainId(chainId),
      getMinAutoSlippageToleranceL2,
      getCustomSlippageTolerance: () => params.customSlippageTolerance,
    })

    const getShouldSkip = (): boolean =>
      Boolean(
        params.skip ||
          !input.tokenInChainId ||
          !input.tokenOutChainId ||
          !params.amountSpecified ||
          isZeroAmount(params.amountSpecified) ||
          areCurrenciesEqual(input.currencyIn, input.currencyOut),
      )

    return createGetQuoteRequestArgs({
      getShouldSkip,
      getRoutingParams,
      getSlippageParams,
    })(input)
  })
}
