import { WatchQueryFetchPolicy } from '@apollo/client'
import { PartialMessage } from '@bufbuild/protobuf'
import { useQueryClient } from '@tanstack/react-query'
import { GetPortfolioResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb.d'
import { Balance } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { PortfolioValueModifier as RestPortfolioValueModifier } from '@uniswap/client-data-api/dist/data/v1/types_pb.d'
import { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { normalizeTokenAddressForCache } from 'uniswap/src/data/cache'
import { GetPortfolioInput, getPortfolioQuery, useGetPortfolioQuery } from 'uniswap/src/data/rest/getPortfolio'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import {
  buildPortfolioBalance,
  PortfolioCacheUpdater,
  PortfolioDataResult,
  PortfolioTotalValueResult,
} from 'uniswap/src/features/dataApi/balances/balances'
import { mapRestStatusToNetworkStatus, matchesCurrency } from 'uniswap/src/features/dataApi/balances/utils'
import { PortfolioBalance, RestContract } from 'uniswap/src/features/dataApi/types'
import { buildCurrency, buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { currencyIdToRestContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import {
  getRestCurrencySafetyInfo,
  getRestTokenSafetyInfo,
} from 'uniswap/src/features/dataApi/utils/getCurrencySafetyInfo'
import { useHideSmallBalancesSetting, useHideSpamTokensSetting } from 'uniswap/src/features/settings/hooks'
import { useCurrencyIdToVisibility } from 'uniswap/src/features/transactions/selectors'
import { CurrencyId } from 'uniswap/src/types/currency'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { usePlatformBasedFetchPolicy } from 'uniswap/src/utils/usePlatformBasedFetchPolicy'
import { useEvent } from 'utilities/src/react/hooks'

export type RestTokenOverrides = {
  includeOverrides: RestContract[]
  excludeOverrides: RestContract[]
}

/**
 * REST implementation for fetching portfolio balances
 */
export function usePortfolioData({
  evmAddress,
  svmAddress,
  ...queryOptions
}: {
  skip?: boolean
  pollInterval?: PollingInterval
  fetchPolicy?: WatchQueryFetchPolicy
} & GetPortfolioInput['input']): PortfolioDataResult {
  const { chains: defaultChainIds } = useEnabledChains()
  const chainIds = queryOptions.chainIds || defaultChainIds

  // TODO(SWAP-388): GetPortfolio REST endpoint does not yet support modifier array; it will take 1 evm/svm address, but will apply the modifications across the board
  const modifier = useRestPortfolioValueModifier(evmAddress ?? svmAddress)

  const { pollInterval: internalPollInterval } = usePlatformBasedFetchPolicy({
    fetchPolicy: queryOptions.fetchPolicy,
    pollInterval: queryOptions.pollInterval,
  })

  const selectFormattedData = useEvent((portfolioData: GetPortfolioResponse | undefined) => {
    if (!portfolioData?.portfolio?.balances) {
      return undefined
    }

    const byId: Record<CurrencyId, PortfolioBalance> = {}

    portfolioData.portfolio.balances.forEach((balance) => {
      const portfolioBalance = convertRestBalanceToPortfolioBalance(balance, evmAddress)
      if (portfolioBalance) {
        byId[portfolioBalance.currencyInfo.currencyId] = portfolioBalance
      }
    })

    return byId
  })

  const {
    data: formattedData,
    isFetching: restLoading,
    refetch: restRefetch,
    error: restError,
    status: restStatus,
  } = useGetPortfolioQuery({
    input: { evmAddress, svmAddress, chainIds, modifier },
    enabled: !!(evmAddress ?? svmAddress) && !queryOptions.skip,
    refetchInterval: internalPollInterval,
    select: selectFormattedData,
  })

  return {
    data: formattedData,
    loading: restLoading,
    networkStatus: mapRestStatusToNetworkStatus(restStatus),
    refetch: restRefetch,
    error: restError || undefined,
  }
}

/**
 * Helps generate modifiers when requesting a portfolio for one or more addresses with our REST endpoint.
 * These modifiers control manual overrides for tokens that are included or excluded from portfolio calculations,
 * and whether to include small balances and spam tokens.
 * @param addresses single address or array of addresses
 * @returns Array of REST portfolio value modifiers to be passed into useGetPortfolioQuery
 */

export function useRestPortfolioValueModifiers(
  addresses?: Address[],
): PartialMessage<RestPortfolioValueModifier>[] | undefined {
  const addressArray = useMemo(() => addresses ?? [], [addresses])
  const currencyIdToTokenVisibility = useCurrencyIdToVisibility(addressArray)
  const includeSpamTokens = !useHideSpamTokensSetting()
  const includeSmallBalances = !useHideSmallBalancesSetting()

  const modifiers = useMemo(() => {
    const { includeOverrides, excludeOverrides } = Object.entries(currencyIdToTokenVisibility).reduce(
      (acc: RestTokenOverrides, [key, tokenVisibility]) => {
        const contractInput = currencyIdToRestContractInput(key)
        tokenVisibility.isVisible ? acc.includeOverrides.push(contractInput) : acc.excludeOverrides.push(contractInput)

        return acc
      },
      {
        includeOverrides: [],
        excludeOverrides: [],
      },
    )

    return addressArray.map((addr) => ({
      address: addr,
      includeOverrides,
      excludeOverrides,
      includeSmallBalances,
      includeSpamTokens,
    }))
  }, [currencyIdToTokenVisibility, addressArray, includeSmallBalances, includeSpamTokens])

  return modifiers.length > 0 ? modifiers : undefined
}

/**
 * Uses useRestPortfolioValueModifiers to return a single REST portfolio value modifier for a single address.
 */
export function useRestPortfolioValueModifier(
  address?: Address,
): PartialMessage<RestPortfolioValueModifier> | undefined {
  const addressArray = useMemo(() => (address ? [address] : undefined), [address])
  const modifiers = useRestPortfolioValueModifiers(addressArray)
  return modifiers?.[0] ?? undefined
}

export function convertRestBalanceToPortfolioBalance(
  balance: NonNullable<NonNullable<GetPortfolioResponse['portfolio']>['balances'][0]>,
  address?: Address,
): PortfolioBalance | undefined {
  const { token, amount, pricePercentChange1d, valueUsd, isHidden } = balance
  if (!token || !amount) {
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
    balanceUSD: valueUsd,
    currencyInfo,
    relativeChange24: pricePercentChange1d,
    isHidden,
  })
}

function updateBalanceVisibility({
  balances,
  targetCurrency,
  isHidden,
}: {
  balances: Balance[]
  targetCurrency: Currency
  isHidden: boolean
}): Pick<Balance, 'token' | 'amount' | 'priceUsd' | 'pricePercentChange1d' | 'valueUsd' | 'isHidden'>[] {
  return balances.map((balance) => {
    const token = balance.token
    if (!token) {
      return balance
    }

    const matches = matchesCurrency(token, targetCurrency)
    return matches ? { ...balance, isHidden } : balance
  })
}

function calculateNewTotalValue({
  currentTotal,
  balanceValue,
  isHiding,
}: {
  currentTotal: number
  balanceValue: number
  isHiding: boolean
}): number {
  return isHiding ? currentTotal - balanceValue : currentTotal + balanceValue
}

export const createPortfolioCacheUpdater =
  (ctx: {
    updateData: (
      input: GetPortfolioInput['input'],
      updater: (old?: GetPortfolioResponse) => GetPortfolioResponse,
    ) => void
    getCurrentData: (input: GetPortfolioInput['input']) => GetPortfolioResponse | undefined
  }) =>
  (input: GetPortfolioInput['input']) => {
    return (updateInput: { hidden: boolean; portfolioBalance?: PortfolioBalance }): void => {
      if (!updateInput.portfolioBalance) {
        return
      }

      const currentData = ctx.getCurrentData(input)

      if (!currentData?.portfolio?.balances) {
        return
      }

      const updatedBalances = updateBalanceVisibility({
        balances: currentData.portfolio.balances,
        targetCurrency: updateInput.portfolioBalance.currencyInfo.currency,
        isHidden: updateInput.hidden,
      })

      const newTotal = calculateNewTotalValue({
        currentTotal: currentData.portfolio.totalValueUsd || 0,
        balanceValue: updateInput.portfolioBalance.balanceUSD || 0,
        isHiding: updateInput.hidden,
      })

      ctx.updateData(
        input,
        (old) =>
          ({
            ...(old || currentData),
            portfolio: {
              ...currentData.portfolio,
              balances: updatedBalances,
              totalValueUsd: newTotal,
            },
          }) as GetPortfolioResponse,
      )
    }
  }

export function usePortfolioCacheUpdater(evmAddress?: string, svmAddress?: string): PortfolioCacheUpdater {
  const { chains: chainIds } = useEnabledChains()
  const queryClient = useQueryClient()

  // TODO(SWAP-388): GetPortfolio REST endpoint does not yet support modifier array; it will take 1 evm/svm address, but will apply the modifications across the board
  const modifier = useRestPortfolioValueModifier(evmAddress ?? svmAddress)

  const cacheUpdater = useMemo(() => {
    return createPortfolioCacheUpdater({
      getCurrentData: (input) => queryClient.getQueryData(getPortfolioQuery({ input }).queryKey),
      updateData: (input, dataUpdater) => {
        queryClient.setQueryData(getPortfolioQuery({ input }).queryKey, dataUpdater)
      },
    })
  }, [queryClient])

  return useEvent((hidden: boolean, portfolioBalance?: PortfolioBalance) =>
    cacheUpdater({ evmAddress, svmAddress, chainIds, modifier })({ hidden, portfolioBalance }),
  )
}

export function usePortfolioTotalValue({
  evmAddress,
  svmAddress,
  pollInterval,
  fetchPolicy,
  enabled = true,
}: {
  evmAddress?: Address
  svmAddress?: Address
  pollInterval?: PollingInterval
  fetchPolicy?: WatchQueryFetchPolicy
  enabled?: boolean
}): PortfolioTotalValueResult {
  const { chains: chainIds } = useEnabledChains()

  const { pollInterval: internalPollInterval } = usePlatformBasedFetchPolicy({
    fetchPolicy,
    pollInterval,
  })

  const selectFormattedData = useEvent((portfolioData: GetPortfolioResponse | undefined) => {
    if (!portfolioData?.portfolio) {
      return undefined
    }

    const portfolio = portfolioData.portfolio

    return {
      balanceUSD: portfolio.totalValueUsd,
      percentChange: portfolio.totalValuePercentChange1d,
      absoluteChangeUSD: portfolio.totalValueAbsoluteChange1d,
    }
  })

  // TODO(SWAP-388): GetPortfolio REST endpoint does not yet support modifier array; it will take 1 evm/svm address, but will apply the modifications across the board
  const modifier = useRestPortfolioValueModifier(enabled ? (evmAddress ?? svmAddress) : undefined)

  const {
    data: formattedData,
    isFetching: loading,
    refetch,
    error: restError,
    status: restStatus,
  } = useGetPortfolioQuery({
    input: { evmAddress, svmAddress, chainIds, modifier },
    enabled: !!(evmAddress ?? svmAddress) && enabled,
    refetchInterval: internalPollInterval,
    select: selectFormattedData,
  })

  return {
    data: formattedData,
    loading,
    networkStatus: mapRestStatusToNetworkStatus(restStatus),
    refetch,
    error: restError || undefined,
  }
}
