import type { UseQueryResult } from '@tanstack/react-query'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { GasStrategy, TradingApi } from '@universe/api'
import { DynamicConfigs, SwapConfigKey, useDynamicConfigValue } from '@universe/gating'
import { useMemo } from 'react'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useActiveGasStrategy } from 'uniswap/src/features/gas/hooks'
import type { SwapDelegationInfo } from 'uniswap/src/features/smartWallet/delegation/types'
import { useAllTransactionSettings } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import { useV4SwapEnabled } from 'uniswap/src/features/transactions/swap/hooks/useV4SwapEnabled'
import type { ApprovalTxInfo } from 'uniswap/src/features/transactions/swap/review/hooks/useTokenApprovalInfo'
import { useTokenApprovalInfo } from 'uniswap/src/features/transactions/swap/review/hooks/useTokenApprovalInfo'
import { createBridgeSwapTxAndGasInfoService } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/bridge/bridgeSwapTxAndGasInfoService'
import { createChainedActionSwapTxAndGasInfoService } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/chained/chainedActionTxSwapAndGasInfoService'
import { createClassicSwapTxAndGasInfoService } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/classic/classicSwapTxAndGasInfoService'
import { FALLBACK_SWAP_REQUEST_POLL_INTERVAL_MS } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/constants'
import { createEVMSwapInstructionsService } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/evm/evmSwapInstructionsService'
import { usePresignPermit } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/evm/hooks'
import { createDecorateSwapTxInfoServiceWithEVMLogging } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/evm/logging'
import { createSolanaSwapTxAndGasInfoService } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/svm/solanaSwapTxAndGasInfoService'
import type {
  RoutingServicesMap,
  SwapTxAndGasInfoParameters,
  SwapTxAndGasInfoService,
} from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/swapTxAndGasInfoService'
import { createSwapTxAndGasInfoService } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/swapTxAndGasInfoService'
import { createUniswapXSwapTxAndGasInfoService } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/uniswapx/uniswapXSwapTxAndGasInfoService'
import { createWrapTxAndGasInfoService } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/wrap/wrapTxAndGasInfoService'
import {
  useSwapFormStore,
  useSwapFormStoreDerivedSwapInfo,
} from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import type { SwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import type { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { CurrencyField } from 'uniswap/src/types/currency'
import { useEvent, usePrevious } from 'utilities/src/react/hooks'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import type { QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

type SwapQueryParams = Optional<SwapTxAndGasInfoParameters, 'trade'>

const EMPTY_SWAP_TX_AND_GAS_INFO: SwapTxAndGasInfo = {
  routing: TradingApi.Routing.CLASSIC,
  txRequests: undefined,
  approveTxRequest: undefined,
  revocationTxRequest: undefined,
  gasFee: { isLoading: false, error: null },
  gasFeeEstimation: {},
  trade: undefined,
  permit: undefined,
  swapRequestArgs: undefined,
  unsigned: false,
  includesDelegation: false,
} satisfies SwapTxAndGasInfo

// TODO(swap arch): replace with swap config service
function useSwapConfig(): {
  v4SwapEnabled: boolean
  gasStrategy: GasStrategy
  getCanBatchTransactions?: (chainId: UniverseChainId | undefined) => boolean
  getSwapDelegationInfo?: (chainId: UniverseChainId | undefined) => SwapDelegationInfo
} {
  const chainId = useSwapFormStoreDerivedSwapInfo((s) => s.chainId)
  const gasStrategy = useActiveGasStrategy(chainId, 'general')
  const v4SwapEnabled = useV4SwapEnabled(chainId)
  const { getCanBatchTransactions, getSwapDelegationInfo } = useUniswapContext()
  return useMemo(
    () => ({
      v4SwapEnabled,
      gasStrategy,
      getCanBatchTransactions,
      getSwapDelegationInfo,
    }),
    [v4SwapEnabled, gasStrategy, getCanBatchTransactions, getSwapDelegationInfo],
  )
}

export function useSwapTxAndGasInfoService(): SwapTxAndGasInfoService {
  const swapConfig = useSwapConfig()
  const presignPermit = usePresignPermit()
  const trace = useTrace()
  const transactionSettings = useAllTransactionSettings()
  const instructionService = useMemo(() => {
    return createEVMSwapInstructionsService({
      ...swapConfig,
      presignPermit,
    })
  }, [swapConfig, presignPermit])

  const decorateWithEVMLogging = useEvent(createDecorateSwapTxInfoServiceWithEVMLogging({ trace, transactionSettings }))

  const classicSwapTxInfoService = useMemo(() => {
    const classicService = createClassicSwapTxAndGasInfoService({
      ...swapConfig,
      transactionSettings,
      instructionService,
    })
    return decorateWithEVMLogging(classicService)
  }, [swapConfig, transactionSettings, instructionService, decorateWithEVMLogging])

  const bridgeSwapTxInfoService = useMemo(() => {
    const bridgeService = createBridgeSwapTxAndGasInfoService({
      ...swapConfig,
      transactionSettings,
      instructionService,
    })
    return decorateWithEVMLogging(bridgeService)
  }, [swapConfig, transactionSettings, instructionService, decorateWithEVMLogging])

  const uniswapXSwapTxInfoService = useMemo(() => {
    return createUniswapXSwapTxAndGasInfoService()
  }, [])

  const chainedSwapTxInfoService = useMemo(() => {
    const chainedService = createChainedActionSwapTxAndGasInfoService()
    return chainedService
  }, [])

  const wrapTxInfoService = useMemo(() => {
    const wrapService = createWrapTxAndGasInfoService({ ...swapConfig, transactionSettings, instructionService })
    return decorateWithEVMLogging(wrapService)
  }, [swapConfig, transactionSettings, instructionService, decorateWithEVMLogging])

  const solanaSwapTxInfoService = useMemo(() => {
    return createSolanaSwapTxAndGasInfoService()
  }, [])

  const services = useMemo(() => {
    return {
      [TradingApi.Routing.CLASSIC]: classicSwapTxInfoService,
      [TradingApi.Routing.BRIDGE]: bridgeSwapTxInfoService,
      [TradingApi.Routing.PRIORITY]: uniswapXSwapTxInfoService,
      [TradingApi.Routing.DUTCH_V2]: uniswapXSwapTxInfoService,
      [TradingApi.Routing.DUTCH_V3]: uniswapXSwapTxInfoService,
      [TradingApi.Routing.WRAP]: wrapTxInfoService,
      [TradingApi.Routing.UNWRAP]: wrapTxInfoService,
      [TradingApi.Routing.CHAINED]: chainedSwapTxInfoService,
      [TradingApi.Routing.LIMIT_ORDER]: createNoopService(),
      [TradingApi.Routing.DUTCH_LIMIT]: createNoopService(),
      [TradingApi.Routing.JUPITER]: solanaSwapTxInfoService,
    } satisfies RoutingServicesMap
  }, [
    classicSwapTxInfoService,
    bridgeSwapTxInfoService,
    uniswapXSwapTxInfoService,
    chainedSwapTxInfoService,
    wrapTxInfoService,
    solanaSwapTxInfoService,
  ])

  return useMemo(() => {
    return createSwapTxAndGasInfoService({ services })
  }, [services])
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
function parseQueryKeyParams(params: SwapQueryParams): SwapQueryKeyParams {
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
function getCanUsePlaceholderData(params: SwapQueryParams, prevParams?: SwapQueryParams): boolean {
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
  swapTxAndGasInfoService: SwapTxAndGasInfoService<Trade>
  refetchInterval: number
}) {
  return function getQueryOptions(
    params: SwapQueryParams,
  ): QueryOptionsResult<
    SwapTxAndGasInfo | null,
    Error,
    SwapTxAndGasInfo | null,
    [ReactQueryCacheKey.SwapTxAndGasInfo, SwapQueryKeyParams]
  > {
    const { trade } = params

    return queryOptions({
      queryKey: [ReactQueryCacheKey.SwapTxAndGasInfo, parseQueryKeyParams(params)],
      queryFn: async () => (trade ? ctx.swapTxAndGasInfoService.getSwapTxAndGasInfo({ ...params, trade }) : null),
      refetchInterval: ctx.refetchInterval,
      enabled: !!trade,
    })
  }
}

function useSwapParams(): {
  approvalTxInfo: ApprovalTxInfo
  derivedSwapInfo: DerivedSwapInfo
  trade: Trade | undefined
} {
  const derivedSwapInfo = useSwapFormStore((s) => s.derivedSwapInfo)

  const account = useWallet().evmAccount

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

/**
 * Takes in the trade and then finds the appropriate service to use
 * and to obtain the necessary information tx and gas info.
 */
function useSwapTxAndGasInfoQuery(input: {
  trade: Trade | undefined
  approvalTxInfo: ApprovalTxInfo
  derivedSwapInfo: DerivedSwapInfo
}): UseQueryResult<SwapTxAndGasInfo | null, Error> {
  const swapTxAndGasInfoService = useSwapTxAndGasInfoService()

  const refetchInterval = useDynamicConfigValue({
    config: DynamicConfigs.Swap,
    key: SwapConfigKey.TradingApiSwapRequestMs,
    defaultValue: FALLBACK_SWAP_REQUEST_POLL_INTERVAL_MS,
  })

  const getQueryOptions = useEvent(createGetQueryOptions({ swapTxAndGasInfoService, refetchInterval }))

  return useQuery(getQueryOptions(input))
}

/**
 * Main hook that manages fetching the swap's tx and gas info once
 * the swap form has valid inputs and other conditions are met.
 */
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
