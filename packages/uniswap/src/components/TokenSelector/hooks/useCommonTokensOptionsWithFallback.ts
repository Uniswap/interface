import { UniverseChainId } from '@universe/chains'
import { useMemo } from 'react'
import { TokenOption } from 'uniswap/src/components/lists/items/types'
import { useCommonTokensOptions } from 'uniswap/src/components/TokenSelector/hooks/useCommonTokensOptions'
import {
  currencyInfosToTokenOptions,
  useCurrencyInfosToTokenOptions,
} from 'uniswap/src/components/TokenSelector/hooks/useCurrencyInfosToTokenOptions'
import { type PortfolioBalancesResult } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioBalancesForAddressById'
import { COMMON_BASES } from 'uniswap/src/constants/routing'
import { useMultichainCurrencyInfosWithoutBridgedNatives } from 'uniswap/src/features/tokens/useMultichainCurrencyInfos'
import { currencyId } from 'uniswap/src/utils/currencyId'
import type { DerivedQueryResult } from 'utilities/src/reactQuery/types'

export function useCommonTokensOptionsWithFallback({
  chainFilter,
  portfolioData,
}: {
  chainFilter: UniverseChainId | null
  portfolioData: PortfolioBalancesResult
}): DerivedQueryResult<TokenOption[] | undefined> {
  const { data, error, refetch, isLoading } = useCommonTokensOptions({ chainFilter, portfolioData })
  const commonBases = useMemo(
    () => (chainFilter ? currencyInfosToTokenOptions(COMMON_BASES[chainFilter]) : undefined),
    [chainFilter],
  )
  const commonBasesCurrencyIds = useMemo(
    () => commonBases?.map((token) => currencyId(token.currencyInfo.currency)).filter(Boolean) ?? [],
    [commonBases],
  )
  const { data: commonBasesCurrencies } = useMultichainCurrencyInfosWithoutBridgedNatives(commonBasesCurrencyIds)
  const commonBasesTokenOptions = useCurrencyInfosToTokenOptions({
    currencyInfos: commonBasesCurrencies,
    portfolioBalancesById: {},
  })

  const shouldFallback = data?.length === 0 && commonBases?.length

  return useMemo(
    () => ({
      data: shouldFallback ? commonBasesTokenOptions : data,
      error: shouldFallback ? null : error,
      refetch,
      isLoading,
    }),
    [commonBasesTokenOptions, data, error, isLoading, refetch, shouldFallback],
  )
}
