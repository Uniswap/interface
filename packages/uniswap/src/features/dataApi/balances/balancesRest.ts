import type { WatchQueryFetchPolicy } from '@apollo/client'
import { type PlainMessage } from '@bufbuild/protobuf'
import type { GetPortfolioResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb.d'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import type { PollingInterval } from 'uniswap/src/constants/misc'
import { calculateTotalBalancesUsdPerChainRest } from 'uniswap/src/data/balances/utils'
import { normalizeTokenAddressForCache } from 'uniswap/src/data/cache'
import { useGetPortfolioQuery } from 'uniswap/src/data/rest/getPortfolio'
import type { GetPortfolioInput } from 'uniswap/src/data/rest/getPortfolio'
import {
  shouldTransformToMultichain,
  transformPortfolioToMultichain,
} from 'uniswap/src/data/rest/transformPortfolioToMultichain'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { buildPortfolioBalance } from 'uniswap/src/features/dataApi/balances/buildPortfolioBalance'
import { getPortfolioMultichainBalancesById } from 'uniswap/src/features/dataApi/balances/toPortfolioMultichainBalance'
import {
  useRestPortfolioValueModifier,
  useRestPortfolioValueModifiers,
} from 'uniswap/src/features/dataApi/balances/useRestPortfolioValueModifier'
import type { BaseResult, PortfolioBalance, PortfolioMultichainBalance } from 'uniswap/src/features/dataApi/types'
import { buildCurrency, buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import {
  getRestCurrencySafetyInfo,
  getRestTokenSafetyInfo,
} from 'uniswap/src/features/dataApi/utils/getCurrencySafetyInfo'
import type { CurrencyId } from 'uniswap/src/types/currency'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { usePlatformBasedFetchPolicy } from 'uniswap/src/utils/usePlatformBasedFetchPolicy'
import { useEvent } from 'utilities/src/react/hooks'

export { useRestPortfolioValueModifier, useRestPortfolioValueModifiers }

/** Return type for portfolio data (Record<CurrencyId, PortfolioBalance>). data is undefined while loading. */
export type PortfolioDataResult = BaseResult<Record<CurrencyId, PortfolioBalance> | undefined>
/** Return type for portfolio data in multichain format (Record<CurrencyId, PortfolioMultichainBalance>). data is undefined while loading. */
export type PortfolioDataResultMultichain = BaseResult<Record<CurrencyId, PortfolioMultichainBalance> | undefined>

/**
 * Pure formatter: converts REST portfolio response to legacy or multichain map.
 * Exported for testing so we can assert existing behavior without mocking the hook.
 */
export function formatPortfolioResponseToMap({
  portfolioData,
  ownerAddress,
  useMultichainFormat,
}: {
  portfolioData: PlainMessage<GetPortfolioResponse> | undefined
  ownerAddress: string | undefined
  useMultichainFormat: false
}): Record<CurrencyId, PortfolioBalance> | undefined
export function formatPortfolioResponseToMap({
  portfolioData,
  ownerAddress,
  useMultichainFormat,
  requestedMultichainFromBackend,
}: {
  portfolioData: PlainMessage<GetPortfolioResponse> | undefined
  ownerAddress: string | undefined
  useMultichainFormat: true
  /** When true, only use response.multichainBalances; do not fall back to transforming legacy. */
  requestedMultichainFromBackend?: boolean
}): Record<CurrencyId, PortfolioMultichainBalance> | undefined
export function formatPortfolioResponseToMap({
  portfolioData,
  ownerAddress,
  useMultichainFormat,
  requestedMultichainFromBackend,
}: {
  portfolioData: PlainMessage<GetPortfolioResponse> | undefined
  ownerAddress: string | undefined
  useMultichainFormat: boolean
  requestedMultichainFromBackend?: boolean
}): Record<CurrencyId, PortfolioBalance> | Record<CurrencyId, PortfolioMultichainBalance> | undefined {
  if (!portfolioData?.portfolio) {
    return undefined
  }

  if (useMultichainFormat) {
    const hasMultichainFromBackend = portfolioData.portfolio.multichainBalances.length > 0
    // When we requested multichain from backend, only use response.multichainBalances — do not fall back to transforming legacy (that would show real data instead of mock).
    if (requestedMultichainFromBackend === true && !hasMultichainFromBackend) {
      return {}
    }
    // transformPortfolioToMultichain constructs real Message instances; the plain cache value is structurally compatible.
    const response = portfolioData as GetPortfolioResponse
    const transformed = shouldTransformToMultichain(response) ? transformPortfolioToMultichain(response) : response
    const multichainMap = getPortfolioMultichainBalancesById(transformed, ownerAddress)
    const byCurrencyId: Record<CurrencyId, PortfolioMultichainBalance> = {}
    if (!multichainMap) {
      return byCurrencyId
    }
    for (const multichain of Object.values(multichainMap)) {
      const token = multichain.tokens[0]
      if (!token) {
        continue
      }
      byCurrencyId[token.currencyInfo.currencyId] = multichain
    }
    return byCurrencyId
  }

  const balances = portfolioData.portfolio.balances
  const byId: Record<CurrencyId, PortfolioBalance> = {}

  balances.forEach((balance) => {
    const portfolioBalance = convertRestBalanceToPortfolioBalance(balance, ownerAddress)
    if (portfolioBalance) {
      byId[portfolioBalance.currencyInfo.currencyId] = portfolioBalance
    }
  })

  return byId
}

export type UsePortfolioDataQueryOptions = {
  skip?: boolean
  /** Cache-only read: never fetches, but still re-renders when another observer updates the cached data. */
  cacheOnly?: boolean
  pollInterval?: PollingInterval
  fetchPolicy?: WatchQueryFetchPolicy
  /**
   * When true, request portfolio.multichainBalances from backend (mock/dummy data).
   * When false or omitted, request legacy portfolio.balances and transform to multichain shape on client.
   * Default false so we never accidentally fetch multichain data from backend.
   */
  requestMultichainFromBackend?: boolean
} & GetPortfolioInput['input']

/** Internal: runs the portfolio query with a select that determines the result data type. */
function usePortfolioDataQueryWithSelect<T>(
  options: UsePortfolioDataQueryOptions & {
    select: (portfolioData: PlainMessage<GetPortfolioResponse> | undefined) => T
  },
): BaseResult<T> {
  const { evmAddress, svmAddress, select, requestMultichainFromBackend, cacheOnly, ...queryOptions } = options
  const { chains: defaultChainIds } = useEnabledChains()
  const chainIds = queryOptions.chainIds || defaultChainIds
  const isV2TokensEnabled = useFeatureFlag(FeatureFlags.V2EndpointsTokens)

  // TODO(SWAP-388): GetPortfolio REST endpoint does not yet support modifier array; it will take 1 evm/svm address, but will apply the modifications across the board
  const modifier = useRestPortfolioValueModifier(evmAddress ?? svmAddress)

  const { pollInterval: internalPollInterval } = usePlatformBasedFetchPolicy({
    fetchPolicy: queryOptions.fetchPolicy,
    pollInterval: queryOptions.pollInterval,
  })

  // Only request multichain from backend when explicitly true; otherwise always false (legacy data)
  const multichain = requestMultichainFromBackend === true

  const {
    data: formattedData,
    isFetching: restLoading,
    refetch: restRefetch,
    error: restError,
    isPending: restPending,
    isError: restIsError,
    dataUpdatedAt,
  } = useGetPortfolioQuery({
    input: {
      evmAddress,
      svmAddress,
      chainIds,
      modifier,
      multichain,
      ...(isV2TokensEnabled && { useSubstreamData: true }),
    },
    enabled: !!(evmAddress ?? svmAddress) && !queryOptions.skip,
    cacheOnly,
    refetchInterval: internalPollInterval,
    select,
  })

  return {
    data: formattedData,
    loading: restLoading,
    isPending: restPending,
    isError: restIsError,
    refetch: restRefetch,
    error: restError || undefined,
    dataUpdatedAt: dataUpdatedAt || undefined,
  }
}

/**
 * REST implementation for portfolio balances (Record<CurrencyId, PortfolioBalance>).
 */
export function usePortfolioData(options: UsePortfolioDataQueryOptions): PortfolioDataResult {
  const ownerAddress = options.evmAddress ?? options.svmAddress
  const select = useEvent((data: PlainMessage<GetPortfolioResponse> | undefined) =>
    formatPortfolioResponseToMap({
      portfolioData: data,
      ownerAddress,
      useMultichainFormat: false,
    }),
  )
  return usePortfolioDataQueryWithSelect({ ...options, select, requestMultichainFromBackend: false })
}

/**
 * REST implementation for portfolio balances in multichain format (Record<CurrencyId, PortfolioMultichainBalance>).
 * When requestMultichainFromBackend is false (default): fetches legacy portfolio.balances and transforms to multichain shape on client.
 * When requestMultichainFromBackend is true: fetches portfolio.multichainBalances from backend (mock data, already in multichain shape).
 */
export function usePortfolioDataMultichain(options: UsePortfolioDataQueryOptions): PortfolioDataResultMultichain {
  const ownerAddress = options.evmAddress ?? options.svmAddress
  const requestedMultichainFromBackend = options.requestMultichainFromBackend
  const select = useEvent((data: PlainMessage<GetPortfolioResponse> | undefined) =>
    formatPortfolioResponseToMap({
      portfolioData: data,
      ownerAddress,
      useMultichainFormat: true,
      requestedMultichainFromBackend,
    }),
  )
  return usePortfolioDataQueryWithSelect({ ...options, select })
}

/**
 * Cache-only read of total balances USD per chain, for telemetry.
 * Built on the same query plumbing as `usePortfolioData` so its cache key always matches the
 * queries that actually fetch portfolio data (never fetches on its own).
 */
export function usePortfolioTotalBalancesUsdPerChain({
  evmAddress,
  svmAddress,
}: {
  evmAddress?: Address
  svmAddress?: Address
}): Record<string, number> | undefined {
  const { data } = usePortfolioDataQueryWithSelect({
    evmAddress,
    svmAddress,
    select: calculateTotalBalancesUsdPerChainRest,
    requestMultichainFromBackend: false,
    cacheOnly: true,
  })
  return data
}

export function convertRestBalanceToPortfolioBalance(
  balance: NonNullable<NonNullable<PlainMessage<GetPortfolioResponse>['portfolio']>['balances'][0]>,
  address?: Address,
): PortfolioBalance | undefined {
  const { token, amount, pricePercentChange1d, valueUsd, isHidden } = balance
  if (!token || !amount || !(amount.amount > 0)) {
    return undefined
  }

  const { chainId, address: unnormalizedTokenAddress, decimals, symbol, name, metadata } = token
  const tokenAddress = normalizeTokenAddressForCache(unnormalizedTokenAddress)
  const { logoUrl, protectionInfo } = metadata || {}

  const currency = buildCurrency({
    chainId,
    address: tokenAddress,
    decimals,
    symbol,
    name,
    buyFeeBps: metadata?.feeData?.feeDetector?.buyFeeBps,
    sellFeeBps: metadata?.feeData?.feeDetector?.sellFeeBps,
  })

  if (!currency) {
    return undefined
  }

  const id = currencyId(currency)
  const tokenBalanceId = `${chainId}-${tokenAddress}-${address}`
  const { isSpam, spamCodeValue, mappedSafetyLevel } = getRestTokenSafetyInfo(metadata)

  const currencyInfo = buildCurrencyInfo({
    currency,
    currencyId: id,
    logoUrl,
    isSpam,
    safetyInfo: getRestCurrencySafetyInfo(mappedSafetyLevel, protectionInfo),
    spamCode: spamCodeValue,
  })

  return buildPortfolioBalance({
    id: tokenBalanceId,
    cacheId: `TokenBalance:${tokenBalanceId}`,
    quantity: amount.amount,
    // Protobuf string fields default to '' — normalize to undefined so consumers can fall back.
    quantityRaw: amount.raw || undefined,
    balanceUSD: valueUsd,
    currencyInfo,
    relativeChange24: pricePercentChange1d,
    isHidden,
  })
}

export {
  usePortfolioBalanceBreakdown,
  usePortfolioBalancePart,
  usePortfolioTotalValue,
} from './usePortfolioBalancePart'
