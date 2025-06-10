import { UseQueryOptions, UseQueryResult, queryOptions, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useAccountMeta, useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__'
import { GasStrategy } from 'uniswap/src/data/tradingApi/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useActiveGasStrategy, useShadowGasStrategies } from 'uniswap/src/features/gas/hooks'
import { DynamicConfigs, SwapConfigKey } from 'uniswap/src/features/gating/configs'
import { useDynamicConfigValue } from 'uniswap/src/features/gating/hooks'
import { SwapDelegationInfo } from 'uniswap/src/features/smartWallet/delegation/types'
import { useTransactionSettingsContext } from 'uniswap/src/features/transactions/components/settings/contexts/TransactionSettingsContext'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import {
  ApprovalTxInfo,
  useTokenApprovalInfo,
} from 'uniswap/src/features/transactions/swap/contexts/hooks/useTokenApprovalInfo'
import { useV4SwapEnabled } from 'uniswap/src/features/transactions/swap/hooks/useV4SwapEnabled'
import { createBridgeSwapTxAndGasInfoService } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/bridge/bridgeSwapTxAndGasInfoService'
import { createClassicSwapTxAndGasInfoService } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/classic/classicSwapTxAndGasInfoService'
import { FALLBACK_SWAP_REQUEST_POLL_INTERVAL_MS } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/constants'
import { createEVMSwapInstructionsService } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/evm/evmSwapInstructionsService'
import { usePresignPermit } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/evm/hooks'
import { createDecorateSwapTxInfoServiceWithEVMLogging } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/evm/logging'
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
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { WithOptional } from 'utilities/src/typescript/withOptional'

type SwapQueryParams = WithOptional<SwapTxAndGasInfoParameters, 'trade'>

const EMPTY_SWAP_TX_AND_GAS_INFO: SwapTxAndGasInfo = {
  routing: Routing.CLASSIC,
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
  activeGasStrategy: GasStrategy
  shadowGasStrategies: GasStrategy[]
  getCanBatchTransactions?: (chainId: UniverseChainId | undefined) => boolean
  getSwapDelegationInfo?: (chainId: UniverseChainId | undefined) => SwapDelegationInfo
} {
  const { chainId } = useSwapFormContext().derivedSwapInfo
  const activeGasStrategy = useActiveGasStrategy(chainId, 'general')
  const shadowGasStrategies = useShadowGasStrategies(chainId, 'general')
  const v4SwapEnabled = useV4SwapEnabled(chainId)
  const { getCanBatchTransactions, getSwapDelegationInfo } = useUniswapContext()
  return useMemo(
    () => ({
      v4SwapEnabled,
      activeGasStrategy,
      shadowGasStrategies,
      getCanBatchTransactions,
      getSwapDelegationInfo,
    }),
    [v4SwapEnabled, activeGasStrategy, shadowGasStrategies, getCanBatchTransactions, getSwapDelegationInfo],
  )
}

export function useSwapTxAndGasInfoService(): SwapTxAndGasInfoService {
  const swapConfig = useSwapConfig()
  const presignPermit = usePresignPermit()
  const trace = useTrace()
  const transactionSettings = useTransactionSettingsContext()
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

  const wrapTxInfoService = useMemo(() => {
    const wrapService = createWrapTxAndGasInfoService({ ...swapConfig, transactionSettings, instructionService })
    return decorateWithEVMLogging(wrapService)
  }, [swapConfig, transactionSettings, instructionService, decorateWithEVMLogging])

  const services = useMemo(() => {
    return {
      [Routing.CLASSIC]: classicSwapTxInfoService,
      [Routing.BRIDGE]: bridgeSwapTxInfoService,
      [Routing.PRIORITY]: uniswapXSwapTxInfoService,
      [Routing.DUTCH_V2]: uniswapXSwapTxInfoService,
      [Routing.DUTCH_V3]: uniswapXSwapTxInfoService,
      [Routing.WRAP]: wrapTxInfoService,
      [Routing.UNWRAP]: wrapTxInfoService,
      [Routing.LIMIT_ORDER]: createNoopService(),
      [Routing.DUTCH_LIMIT]: createNoopService(),
    } satisfies RoutingServicesMap
  }, [classicSwapTxInfoService, bridgeSwapTxInfoService, uniswapXSwapTxInfoService, wrapTxInfoService])

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
  ): UseQueryOptions<SwapTxAndGasInfo, Error, SwapTxAndGasInfo, (string | SwapQueryKeyParams)[]> {
    const { trade } = params
    const queryFn = trade
      ? (): Promise<SwapTxAndGasInfo> => ctx.swapTxAndGasInfoService.getSwapTxAndGasInfo({ ...params, trade })
      : undefined

    return queryOptions({
      queryKey: ['swapTxAndGasInfo', parseQueryKeyParams(params)],
      queryFn,
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
