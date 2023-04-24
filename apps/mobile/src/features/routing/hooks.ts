import { SerializedError } from '@reduxjs/toolkit'
import { FetchBaseQueryError, skipToken } from '@reduxjs/toolkit/dist/query'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { ChainId } from 'src/constants/chains'
import { PollingInterval } from 'src/constants/misc'
import { FEATURE_FLAGS } from 'src/features/experiments/constants'
import { useFeatureFlag } from 'src/features/experiments/hooks'
import { useQuoteQuery } from 'src/features/routing/routingApi'
import { PermitSignatureInfo } from 'src/features/transactions/swap/usePermit2Signature'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { currencyAddressForSwapQuote } from 'src/utils/currencyId'
import { useDebounceWithStatus } from 'src/utils/timing'

export interface UseQuoteProps {
  amountSpecified: CurrencyAmount<Currency> | null | undefined
  otherCurrency: Currency | null | undefined
  tradeType: TradeType
  pollingInterval?: PollingInterval
  skip?: boolean
  fetchSimulatedGasLimit?: boolean
  permitSignatureInfo?: PermitSignatureInfo | null
  slippageTolerance?: number
}

/**
 * Fetches quote from Routing API
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useRouterQuote(params: UseQuoteProps) {
  const recipient = useActiveAccount()
  const enableUniversalRouter = useFeatureFlag(FEATURE_FLAGS.SwapPermit2)

  const {
    amountSpecified,
    tradeType,
    otherCurrency,
    pollingInterval = PollingInterval.Fast,
    skip,
    fetchSimulatedGasLimit,
    permitSignatureInfo,
    slippageTolerance,
  } = params

  const currencyIn = tradeType === TradeType.EXACT_INPUT ? amountSpecified?.currency : otherCurrency
  const currencyOut =
    tradeType === TradeType.EXACT_OUTPUT ? amountSpecified?.currency : otherCurrency

  const tokenInAddress = currencyIn ? currencyAddressForSwapQuote(currencyIn) : undefined
  const tokenInChainId = currencyIn?.chainId
  const tokenOutAddress = currencyOut ? currencyAddressForSwapQuote(currencyOut) : undefined
  const tokenOutChainId = currencyOut?.chainId

  const skipQuery =
    skip ||
    !amountSpecified ||
    !tokenInAddress ||
    !tokenOutAddress ||
    !tokenInChainId ||
    !tokenOutChainId

  const result = useQuoteQuery(
    skipQuery
      ? skipToken
      : {
          enableUniversalRouter,
          tokenInAddress,
          tokenInChainId,
          tokenOutAddress,
          tokenOutChainId,
          amount: amountSpecified.quotient.toString(),
          type: tradeType === TradeType.EXACT_INPUT ? 'exactIn' : 'exactOut',
          recipient: recipient?.address,
          fetchSimulatedGasLimit,
          permitSignatureInfo,
          slippageTolerance,
        },
    {
      pollingInterval,
    }
  )

  return result
}

const SWAP_GAS_LIMIT_FALLBACKS: Record<ChainId, string> = {
  [ChainId.Mainnet]: '420000',
  [ChainId.Goerli]: '420000',
  [ChainId.Optimism]: '420000',
  [ChainId.Polygon]: '420000',
  [ChainId.PolygonMumbai]: '420000',
  [ChainId.ArbitrumOne]: '1200000',
}

export function useSimulatedGasLimit(
  chainId: ChainId,
  amountSpecified: CurrencyAmount<Currency> | null | undefined,
  otherCurrency: Currency | null | undefined,
  tradeType: TradeType,
  skip: boolean,
  permitSignatureInfo?: PermitSignatureInfo | null
): {
  isLoading: boolean
  error?: boolean | FetchBaseQueryError | SerializedError
  simulatedGasLimit: string
  gasFallbackUsed: boolean
} {
  const [debouncedAmountSpecified, isDebouncing] = useDebounceWithStatus(amountSpecified)

  const { isLoading, error, data } = useRouterQuote({
    amountSpecified: debouncedAmountSpecified,
    otherCurrency,
    tradeType,
    skip,
    fetchSimulatedGasLimit: true,
    permitSignatureInfo,
  })

  return useMemo(
    () => ({
      isLoading: isLoading || isDebouncing,
      error: error || data?.simulationError,
      // if there is a simulation error, gasUseEstimate will be the router-api estimate instead of the accurate
      // Tenderly estimate, and the router-api estimate isn't accurate enough for submitting on-chain
      // instead, fall back to one of our hard-coded estimates
      simulatedGasLimit:
        (data && !data.simulationError && data.gasUseEstimate) || SWAP_GAS_LIMIT_FALLBACKS[chainId],
      gasFallbackUsed: !skip && !!data?.simulationError,
    }),
    [isLoading, isDebouncing, error, data, chainId, skip]
  )
}
