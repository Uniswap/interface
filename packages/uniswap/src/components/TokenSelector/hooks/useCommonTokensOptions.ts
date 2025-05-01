import { useCallback, useMemo } from 'react'
import { filter } from 'uniswap/src/components/TokenSelector/filter'
import { useAllCommonBaseCurrencies } from 'uniswap/src/components/TokenSelector/hooks/useAllCommonBaseCurrencies'
import { useCurrencyInfosToTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/useCurrencyInfosToTokenOptions'
import { usePortfolioBalancesForAddressById } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioBalancesForAddressById'
import { TokenOption } from 'uniswap/src/components/lists/items/types'
import { GqlResult } from 'uniswap/src/data/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'

export function useCommonTokensOptions(
  address: Address | undefined,
  chainFilter: UniverseChainId | null,
): GqlResult<TokenOption[] | undefined> {
  const {
    data: portfolioBalancesById,
    error: portfolioBalancesByIdError,
    refetch: portfolioBalancesByIdRefetch,
    loading: loadingPorfolioBalancesById,
  } = usePortfolioBalancesForAddressById(address)

  const {
    data: commonBaseCurrencies,
    error: commonBaseCurrenciesError,
    refetch: refetchCommonBaseCurrencies,
    loading: loadingCommonBaseCurrencies,
  } = useAllCommonBaseCurrencies()

  // this is a one-off filter for USDT on Unichain which at time of launch does not have enough liquidity for swapping so we are filtering it out of quick select
  // TODO(WEB-6284): Replace useAllCommonBaseCurrencies static filter with a dynamic filter
  const USDT_UNICHAIN_ADDRESS = '0x588ce4f028d8e7b53b687865d6a67b3a54c75518'
  const filteredCommonBaseCurrencies = useMemo(() => {
    return commonBaseCurrencies?.filter(
      (currency) =>
        currency.currency.isNative ||
        currency.currency.chainId !== UniverseChainId.Unichain ||
        !areAddressesEqual(USDT_UNICHAIN_ADDRESS, currency.currency.address),
    )
  }, [commonBaseCurrencies])

  const commonBaseTokenOptions = useCurrencyInfosToTokenOptions({
    currencyInfos: filteredCommonBaseCurrencies,
    portfolioBalancesById,
  })

  const refetch = useCallback(() => {
    portfolioBalancesByIdRefetch?.()
    refetchCommonBaseCurrencies?.()
  }, [portfolioBalancesByIdRefetch, refetchCommonBaseCurrencies])

  const error =
    (!portfolioBalancesById && portfolioBalancesByIdError) || (!commonBaseCurrencies && commonBaseCurrenciesError)

  const filteredCommonBaseTokenOptions = useMemo(
    () => commonBaseTokenOptions && filter(commonBaseTokenOptions, chainFilter),
    [chainFilter, commonBaseTokenOptions],
  )

  return useMemo(
    () => ({
      data: filteredCommonBaseTokenOptions,
      refetch,
      error: error || undefined,
      loading: loadingPorfolioBalancesById || loadingCommonBaseCurrencies,
    }),
    [error, loadingCommonBaseCurrencies, loadingPorfolioBalancesById, filteredCommonBaseTokenOptions, refetch],
  )
}
