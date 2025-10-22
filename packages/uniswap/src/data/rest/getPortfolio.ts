import { PartialMessage } from '@bufbuild/protobuf'
import { createPromiseClient } from '@connectrpc/connect'
import { Query, queryOptions, UseQueryResult, useQuery } from '@tanstack/react-query'
import { DataApiService } from '@uniswap/client-data-api/dist/data/v1/api_connect'
import { GetPortfolioRequest, GetPortfolioResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { Balance } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { SharedQueryClient, transformInput, WithoutWalletAccount } from '@universe/api'
import { uniswapGetTransport } from 'uniswap/src/data/rest/base'
import {
  AccountAddressesByPlatform,
  buildAccountAddressesByPlatform,
  isAccountAddressesByPlatform,
} from 'uniswap/src/data/rest/buildAccountAddressesByPlatform'
import {
  cleanupCaughtUpOverrides,
  getOverridesForAddress,
  getOverridesForQuery,
  getPortfolioQueryApolloClient,
  getPortfolioQueryReduxStore,
} from 'uniswap/src/data/rest/portfolioBalanceOverrides'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useRestPortfolioValueModifier } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { fetchAndMergeOnchainBalances } from 'uniswap/src/features/portfolio/portfolioUpdates/rest/refetchRestQueriesViaOnchainOverrideVariantSaga'
import { removeExpiredBalanceOverrides } from 'uniswap/src/features/portfolio/slice/slice'
import { CurrencyId } from 'uniswap/src/types/currency'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { currencyIdToAddress, currencyIdToChain, isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { createLogger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'

export type GetPortfolioInput<TSelectData = GetPortfolioResponse> = {
  input?: WithoutWalletAccount<PartialMessage<GetPortfolioRequest>> & {
    evmAddress?: string
    svmAddress?: string
  }
} & Pick<GetPortfolioQuery<TSelectData>, 'enabled' | 'refetchInterval' | 'select'>

export interface TokenBalanceQuantityParts {
  quantity: number
}

export interface TokenBalanceMainParts {
  denominatedValue?: {
    value?: number
  }
  tokenProjectMarket?: {
    relativeChange24?: {
      value?: number
    }
  }
}

const portfolioClient = createPromiseClient(DataApiService, uniswapGetTransport)

/**
 * Wrapper around query for DataApiService/GetPortfolio
 * This fetches users portfolio and balances data
 */
export function useGetPortfolioQuery<TSelectData = GetPortfolioResponse>(
  params: GetPortfolioInput<TSelectData>,
): UseQueryResult<TSelectData, Error> {
  return useQuery(getPortfolioQuery(params))
}

type GetPortfolioQuery<TSelectData = GetPortfolioResponse> = QueryOptionsResult<
  GetPortfolioResponse | undefined,
  Error,
  TSelectData,
  readonly [
    ReactQueryCacheKey.GetPortfolio,
    AccountAddressesByPlatform | undefined,
    PartialMessage<GetPortfolioRequest> | undefined,
  ]
>

export const getPortfolioQuery = <TSelectData = GetPortfolioResponse>({
  input,
  enabled = true,
  refetchInterval,
  select,
}: GetPortfolioInput<TSelectData>): GetPortfolioQuery<TSelectData> => {
  const accountAddressesByPlatform = buildAccountAddressesByPlatform(input)
  const transformedInput = transformInput(input)

  const {
    // Changes in the `modifier` should not cause a refetch, so it's excluded from the `queryKey`.
    modifier: _modifier,
    // The information in `walletAccount` is already included and normalized in `accountAddressesByPlatform`, so we exclude it here.
    walletAccount: _walletAccount,
    ...inputWithoutModifierAndWalletAccount
  } = transformedInput ?? {}

  return queryOptions({
    queryKey: [ReactQueryCacheKey.GetPortfolio, accountAddressesByPlatform, inputWithoutModifierAndWalletAccount],
    queryFn: async () => {
      const log = createLogger('getPortfolio.ts', 'queryFn', '[REST-ITBU]')

      if (!transformedInput) {
        return Promise.resolve(undefined)
      }

      // Fetch portfolio data from the backend
      const apiResponse = await portfolioClient.getPortfolio(transformedInput)

      try {
        const reduxStore = getPortfolioQueryReduxStore()
        const apolloClient = getPortfolioQueryApolloClient()

        if (!reduxStore || !apolloClient) {
          log.warn('`getPortfolioQuery` called before `initializePortfolioQueryOverrides`')
          return apiResponse
        }

        if (!accountAddressesByPlatform || !apiResponse.portfolio) {
          return apiResponse
        }

        log.debug('Removing potentially expired balance overrides')
        reduxStore.dispatch(removeExpiredBalanceOverrides())

        const overrideCurrencyIds = getOverridesForQuery({ accountAddressesByPlatform })

        if (overrideCurrencyIds.size === 0) {
          log.debug('No overrides to apply, returning original response')
          return apiResponse
        }

        log.debug('Applying portfolio balance overrides', {
          overrideCount: overrideCurrencyIds.size,
          currencyIds: Array.from(overrideCurrencyIds),
          accountAddresses: accountAddressesByPlatform,
        })

        let modifiedResponse = apiResponse
        const addresses = Object.values(accountAddressesByPlatform)

        for (const address of addresses) {
          // Get overrides specific to this address only
          const overridesForCurrentAddress = getOverridesForAddress({ address })

          if (overridesForCurrentAddress.size === 0 || !modifiedResponse.portfolio) {
            continue
          }

          log.debug(`Processing ${overridesForCurrentAddress.size} overrides for address ${address}`, {
            currencyIds: Array.from(overridesForCurrentAddress),
          })

          const mergedResult = await fetchAndMergeOnchainBalances({
            apolloClient,
            cachedPortfolio: modifiedResponse.portfolio,
            accountAddress: address,
            currencyIds: overridesForCurrentAddress,
          })

          if (!mergedResult) {
            log.debug(`No merged result for address ${address}, continuing`)
            continue
          }

          // Check if backend has caught up and clean up overrides if needed
          cleanupCaughtUpOverrides({ ownerAddress: address, originalData: apiResponse, mergedData: mergedResult })

          // Update result for next iteration
          modifiedResponse = mergedResult

          log.debug(`Successfully applied overrides for address ${address}`)
        }

        log.debug('Successfully applied all overrides in queryFn')

        return modifiedResponse
      } catch (error) {
        log.error(new Error('Unexpected error when trying to apply portfolio balance overrides', { cause: error }))
        return apiResponse
      }
    },
    placeholderData: (prev) => prev, // this prevents the loading skeleton from appearing when hiding/unhiding tokens
    refetchInterval,
    enabled,
    subscribed: !!enabled,
    select,
  })
}

/**
 * Gets cached quantity for a specific token balance
 * A targeted optimization to help avoid re-renders in TokenBalanceItem
 */
export function useRestTokenBalanceQuantityParts({
  currencyId,
  evmAddress,
  svmAddress,
  enabled = true,
}: {
  currencyId?: CurrencyId
  evmAddress?: string
  svmAddress?: string
  enabled?: boolean
}): UseQueryResult<TokenBalanceQuantityParts | undefined> {
  const { chains: chainIds } = useEnabledChains()

  // TODO(SWAP-388): GetPortfolio REST endpoint does not yet support modifier array; it will take 1 evm/svm address, but will apply the modifications across the board
  const modifier = useRestPortfolioValueModifier(enabled ? (evmAddress ?? svmAddress) : undefined)

  const selectQuantityParts = useEvent((data: GetPortfolioResponse | undefined) => {
    const balance = _findBalanceFromCurrencyId(data, currencyId)
    return balance ? { quantity: balance.amount?.amount || 0 } : undefined
  })

  return useQuery({
    ...getPortfolioQuery({ input: { evmAddress, svmAddress, chainIds, modifier } }),
    select: selectQuantityParts,
    enabled,
  })
}

/**
 * Gets cached value and price change data for a specific token balance
 * A targeted optimization to help avoid re-renders in TokenBalanceItem
 */
export function useRestTokenBalanceMainParts({
  currencyId,
  evmAddress,
  svmAddress,
  enabled = true,
}: {
  currencyId?: CurrencyId
  evmAddress?: string
  svmAddress?: string
  enabled?: boolean
}): UseQueryResult<TokenBalanceMainParts | undefined> {
  const { chains: chainIds } = useEnabledChains()

  // TODO(SWAP-388): GetPortfolio REST endpoint does not yet support modifier array; it will take 1 evm/svm address, but will apply the modifications across the board
  const modifier = useRestPortfolioValueModifier(enabled ? (evmAddress ?? svmAddress) : undefined)

  const selectMainParts = useEvent((data: GetPortfolioResponse | undefined) => {
    const balance = _findBalanceFromCurrencyId(data, currencyId)

    return balance
      ? {
          denominatedValue: { value: balance.valueUsd },
          tokenProjectMarket: {
            relativeChange24: { value: balance.pricePercentChange1d },
          },
        }
      : undefined
  })

  return useQuery({
    ...getPortfolioQuery({ input: { evmAddress, svmAddress, chainIds, modifier } }),
    select: selectMainParts,
    enabled,
  })
}

function _findBalanceFromCurrencyId(
  data: GetPortfolioResponse | undefined,
  currencyId?: CurrencyId,
): Balance | undefined {
  if (!data?.portfolio?.balances || !currencyId) {
    return undefined
  }

  const tokenAddress = currencyIdToAddress(currencyId)
  const chainId = currencyIdToChain(currencyId)
  const isNative = chainId && isNativeCurrencyAddress(chainId, tokenAddress)

  return data.portfolio.balances.find((bal) => {
    if (bal.token?.chainId !== chainId) {
      return false
    }

    if (isNative) {
      return isNativeCurrencyAddress(chainId, bal.token.address)
    }

    return areAddressesEqual({
      addressInput1: { address: bal.token.address, chainId },
      addressInput2: { address: tokenAddress, chainId },
    })
  })
}

/**
 * Checks if a `GetPortfolio` query key matches the given address and platform.
 * Used to find active queries that need to be updated after a transaction.
 */
export function doesGetPortfolioQueryMatchAddress({
  queryKey,
  address,
  platform,
}: {
  queryKey: readonly unknown[]
  address: string
  platform: Platform
}): boolean {
  const [key, accountAddressesByPlatform] = queryKey

  if (
    key !== ReactQueryCacheKey.GetPortfolio ||
    !accountAddressesByPlatform ||
    !isAccountAddressesByPlatform(accountAddressesByPlatform)
  ) {
    return false
  }

  // Check each platform-address pair in the query
  return Object.entries(accountAddressesByPlatform).some(([queryPlatform, queryAddress]) => {
    return areAddressesEqual({
      addressInput1: { address, platform },
      addressInput2: { address: queryAddress, platform: queryPlatform as Platform },
    })
  })
}

/**
 * Finds all active `GetPortfolio` queries that match the given address and platform.
 * Returns the array of matching queries to update.
 */
export function getPortfolioQueriesToUpdate({
  address,
  platform,
}: {
  address: string
  platform: Platform
}): Query<GetPortfolioResponse | undefined, Error>[] {
  const activePortfolioQueries = SharedQueryClient.getQueryCache().findAll({
    queryKey: [ReactQueryCacheKey.GetPortfolio],
    type: 'active',
  })

  return activePortfolioQueries.filter((query) =>
    doesGetPortfolioQueryMatchAddress({ queryKey: query.queryKey, address, platform }),
  ) as Query<GetPortfolioResponse | undefined, Error>[]
}
