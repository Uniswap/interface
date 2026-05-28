import type { PartialMessage } from '@bufbuild/protobuf'
import type { PortfolioValueModifier as RestPortfolioValueModifier } from '@uniswap/client-data-api/dist/data/v1/types_pb.d'
import { useMemo } from 'react'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import type { RestContract } from 'uniswap/src/features/dataApi/types'
import { currencyIdToRestContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { useHideSmallBalancesSetting, useHideSpamTokensSetting } from 'uniswap/src/features/settings/hooks'
import { useCurrencyIdToVisibility } from 'uniswap/src/features/transactions/selectors'

export type RestTokenOverrides = {
  includeOverrides: RestContract[]
  excludeOverrides: RestContract[]
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
  const { isTestnetModeEnabled } = useEnabledChains()
  const hideSpamTokens = useHideSpamTokensSetting()
  const hideSmallBalances = useHideSmallBalancesSetting()
  const includeSpamTokens = isTestnetModeEnabled || !hideSpamTokens
  const includeSmallBalances = !hideSmallBalances

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
