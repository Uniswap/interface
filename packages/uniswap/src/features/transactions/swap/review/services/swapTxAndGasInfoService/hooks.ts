import { UseQueryOptions, UseQueryResult, queryOptions, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useAccountMeta, useSigner } from 'uniswap/src/contexts/UniswapContext'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__'
import { GasStrategy } from 'uniswap/src/data/tradingApi/types'
import { useActiveGasStrategy, useShadowGasStrategies } from 'uniswap/src/features/gas/hooks'
import { DynamicConfigs, SwapConfigKey } from 'uniswap/src/features/gating/configs'
import { useDynamicConfigValue } from 'uniswap/src/features/gating/hooks'
import { useTransactionSettingsContext } from 'uniswap/src/features/transactions/settings/contexts/TransactionSettingsContext'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import {
  ApprovalTxInfo,
  useTokenApprovalInfo,
} from 'uniswap/src/features/transactions/swap/contexts/hooks/useTokenApprovalInfo'
import { useV4SwapEnabled } from 'uniswap/src/features/transactions/swap/hooks/useV4SwapEnabled'
import { createBridgeSwapTxAndGasInfoService } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/bridge/bridgeSwapTxAndGasInfoService'
import { createClassicSwapTxAndGasInfoService } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/classic/classicSwapTxAndGasInfoService'
import { getShouldPresignPermits } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/classic/utils'
import {
  FALLBACK_SWAP_REQUEST_POLL_INTERVAL_MS,
  WRAP_FALLBACK_GAS_LIMIT_IN_GWEI,
} from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/constants'
import { createEVMSwapRepository } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/evm/evmSwapRepository'
import {
  RoutingServicesMap,
  SwapTxAndGasInfoParameters,
  SwapTxAndGasInfoService,
  createSwapTxAndGasInfoService,
} from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/swapTxAndGasInfoService'
import { createUniswapXSwapTxAndGasInfoService } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/uniswapx/uniswapXSwapTxAndGasInfoService'
import { createWrapTxAndGasInfoService } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/wrap/wrapTxAndGasInfoService'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { SwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { CurrencyField } from 'uniswap/src/types/currency'
import { useEvent, usePrevious } from 'utilities/src/react/hooks'

const EMPTY_SWAP_TX_AND_GAS_INFO: SwapTxAndGasInfo = {
  routing: Routing.CLASSIC,
  txRequest: undefined,
  approveTxRequest: undefined,
  revocationTxRequest: undefined,
  gasFee: { isLoading: false, error: null },
  gasFeeEstimation: {},
  trade: undefined,
  permit: undefined,
  swapRequestArgs: undefined,
  unsigned: false,
} satisfies SwapTxAndGasInfo

// TODO(swap arch): replace with swap config service
function useSwapConfig(): {
  v4SwapEnabled: boolean
  activeGasStrategy: GasStrategy
  shadowGasStrategies: GasStrategy[]
} {
  const { chainId } = useSwapFormContext().derivedSwapInfo
  const activeGasStrategy = useActiveGasStrategy(chainId, 'general')
  const shadowGasStrategies = useShadowGasStrategies(chainId, 'general')
  const v4SwapEnabled = useV4SwapEnabled(chainId)

  return useMemo(
    () => ({
      v4SwapEnabled,
      activeGasStrategy,
      shadowGasStrategies,
    }),
    [v4SwapEnabled, activeGasStrategy, shadowGasStrategies],
  )
}

export function useSwapTxAndGasInfoService(): SwapTxAndGasInfoService<Trade | undefined> {
  const swapConfig = useSwapConfig()
  const signer = useSigner()

  const transactionSettings = useTransactionSettingsContext()

  const swapRepository = useMemo(() => {
    return createEVMSwapRepository()
  }, [])

  const classicSwapTxInfoService = useMemo(() => {
    return createClassicSwapTxAndGasInfoService({
      swapRepository,
      ...swapConfig,
      transactionSettings,
      signer,
      shouldPresignPermits: getShouldPresignPermits(),
    })
  }, [swapRepository, swapConfig, transactionSettings, signer])

  const bridgeSwapTxInfoService = useMemo(() => {
    return createBridgeSwapTxAndGasInfoService({ swapRepository, ...swapConfig, transactionSettings })
  }, [swapRepository, swapConfig, transactionSettings])

  const uniswapXSwapTxInfoService = useMemo(() => {
    return createUniswapXSwapTxAndGasInfoService()
  }, [])

  const wrapTxInfoService = useMemo(() => {
    return createWrapTxAndGasInfoService({ ...swapConfig, fallbackGasLimit: WRAP_FALLBACK_GAS_LIMIT_IN_GWEI * 10e9 })
  }, [swapConfig])

  const services = useMemo(() => {
    return {
      [Routing.CLASSIC]: classicSwapTxInfoService,
      [Routing.BRIDGE]: bridgeSwapTxInfoService,
      [Routing.PRIORITY]: uniswapXSwapTxInfoService,
      [Routing.DUTCH_V2]: uniswapXSwapTxInfoService,
      [Routing.DUTCH_V3]: uniswapXSwapTxInfoService,
      // TODO(WEB-7243): remove noops after we implement trade variant for wraps
      [Routing.WRAP]: createNoopService(),
      [Routing.UNWRAP]: createNoopService(),
      [Routing.LIMIT_ORDER]: createNoopService(),
      [Routing.DUTCH_LIMIT]: createNoopService(),
    } satisfies RoutingServicesMap
  }, [classicSwapTxInfoService, bridgeSwapTxInfoService, uniswapXSwapTxInfoService])

  return useMemo(() => {
    return createSwapTxAndGasInfoService({ services, tradelessWrapService: wrapTxInfoService })
  }, [services, wrapTxInfoService])
}

function createNoopService<T extends Trade>(): SwapTxAndGasInfoService<T> {
  return {
    getSwapTxAndGasInfo: async (): Promise<SwapTxAndGasInfo> => {
      throw new Error('Not implemented')
    },
  }
}

type SwapQueryKeyParams =
  | {
      requestId: string
      approvalTxInfo: ApprovalTxInfo
    }
  | {
      inputCurrencyId?: string
      outputCurrencyId?: string
      inputAmount?: string
      outputAmount?: string
    }

// TODO(WEB-7243): Simplify query key logic once all routing types have a corresponding trade this query can be decoupled from derivedSwapInfo
function parseQueryKeyParams(params: SwapTxAndGasInfoParameters<Trade | undefined>): SwapQueryKeyParams {
  const { trade, derivedSwapInfo } = params
  // If a trade is not defined, supply information about the currencies and amounts to use as a placeholder key params
  if (!trade) {
    const { input, output } = derivedSwapInfo.currencies
    const amounts = derivedSwapInfo.currencyAmounts
    const inputAmount = amounts[CurrencyField.INPUT]?.toExact()
    const outputAmount = amounts[CurrencyField.OUTPUT]?.toExact()

    return {
      inputCurrencyId: input?.currencyId,
      outputCurrencyId: output?.currencyId,
      inputAmount,
      outputAmount,
    }
  }

  return {
    requestId: trade.quote.requestId,
    approvalTxInfo: params.approvalTxInfo,
  }
}

/**
 * Returns true if the params have updated in such a way that the previous query result should be used as placeholder data while fetching the new result,
 * rather than showing a brief loading state in the UX.
 */
function getCanUsePlaceholderData(
  params: SwapTxAndGasInfoParameters<Trade | undefined>,
  prevParams?: SwapTxAndGasInfoParameters<Trade | undefined>,
): boolean {
  if (prevParams?.trade && params.trade) {
    const approvalUnchanged =
      prevParams.approvalTxInfo.tokenApprovalInfo.action === params.approvalTxInfo.tokenApprovalInfo.action
    const tradeInputUnchanged =
      (prevParams.trade.tradeType === params.trade.tradeType &&
        prevParams.trade.inputAmount.equalTo(params.trade.inputAmount)) ||
      prevParams.trade.outputAmount.equalTo(params.trade.outputAmount)

    return approvalUnchanged && tradeInputUnchanged
  }

  return false
}

function createGetQueryOptions(ctx: {
  swapTxAndGasInfoService: SwapTxAndGasInfoService<Trade | undefined>
  refetchInterval: number
}) {
  return function getQueryOptions(
    params: SwapTxAndGasInfoParameters<Trade | undefined>,
  ): UseQueryOptions<SwapTxAndGasInfo, Error, SwapTxAndGasInfo, (string | SwapQueryKeyParams)[]> {
    return queryOptions({
      queryKey: ['swapTxAndGasInfo', parseQueryKeyParams(params)],
      queryFn: () => {
        return ctx.swapTxAndGasInfoService.getSwapTxAndGasInfo(params)
      },
      refetchInterval: ctx.refetchInterval,
    })
  }
}

function useSwapParams(): {
  approvalTxInfo: ApprovalTxInfo
  derivedSwapInfo: DerivedSwapInfo
  trade: Trade | undefined
} {
  const { derivedSwapInfo } = useSwapFormContext()

  const account = useAccountMeta()

  const {
    chainId,
    wrapType,
    currencyAmounts,
    trade: { trade },
  } = derivedSwapInfo

  const approvalTxInfo = useTokenApprovalInfo({
    account,
    chainId,
    wrapType,
    currencyInAmount: currencyAmounts[CurrencyField.INPUT],
    currencyOutAmount: currencyAmounts[CurrencyField.OUTPUT],
    routing: trade?.routing,
  })

  return {
    approvalTxInfo,
    derivedSwapInfo,
    trade: trade ?? undefined,
  }
}

function useSwapTxAndGasInfoQuery(input: {
  trade: Trade | undefined
  approvalTxInfo: ApprovalTxInfo
  derivedSwapInfo: DerivedSwapInfo
}): UseQueryResult<SwapTxAndGasInfo, Error> {
  const swapTxAndGasInfoService = useSwapTxAndGasInfoService()

  const refetchInterval = useDynamicConfigValue(
    DynamicConfigs.Swap,
    SwapConfigKey.TradingApiSwapRequestMs,
    FALLBACK_SWAP_REQUEST_POLL_INTERVAL_MS,
  )

  const getQueryOptions = useEvent(createGetQueryOptions({ swapTxAndGasInfoService, refetchInterval }))

  return useQuery(getQueryOptions(input))
}

export function useSwapTxAndGasInfo(): SwapTxAndGasInfo {
  const params = useSwapParams()
  const { data } = useSwapTxAndGasInfoQuery(params)

  const prevData = usePrevious(data)
  const prevParams = usePrevious(params)

  // Persist prev query result as placeholder data when applicable
  const canUsePlaceholderData = useMemo(() => getCanUsePlaceholderData(params, prevParams), [params, prevParams])
  const placeholderData = canUsePlaceholderData ? prevData : undefined

  return data ?? placeholderData ?? EMPTY_SWAP_TX_AND_GAS_INFO
}
