import { useMemo } from 'react'
import {
  ContractInput,
  PortfolioValueModifier,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { currencyIdToContractInput } from 'uniswap/src/features/dataApi/utils'
import { useHideSmallBalancesSetting, useHideSpamTokensSetting } from 'uniswap/src/features/settings/hooks'
import { useCurrencyIdToVisibility } from 'wallet/src/features/transactions/selectors'

interface TokenOverrides {
  tokenIncludeOverrides: ContractInput[]
  tokenExcludeOverrides: ContractInput[]
}

// TODO(MOB-3643): Redux state sharing opportunities
// Share usePortfolioValueModifiers when redux state for visibility settings is available
export function usePortfolioValueModifiers(address?: Address | Address[]): PortfolioValueModifier[] | undefined {
  // Memoize array creation if passed a string to avoid recomputing at every render
  const addressArray = useMemo(() => (!address ? [] : Array.isArray(address) ? address : [address]), [address])
  const currencyIdToTokenVisibility = useCurrencyIdToVisibility()

  const hideSpamTokens = useHideSpamTokensSetting()
  const hideSmallBalances = useHideSmallBalancesSetting()

  const { tokenIncludeOverrides, tokenExcludeOverrides } = Object.entries(currencyIdToTokenVisibility).reduce(
    (acc: TokenOverrides, [key, tokenVisibility]) => {
      const contractInput = currencyIdToContractInput(key)
      if (tokenVisibility.isVisible) {
        acc.tokenIncludeOverrides.push(contractInput)
      } else {
        acc.tokenExcludeOverrides.push(contractInput)
      }
      return acc
    },
    {
      tokenIncludeOverrides: [],
      tokenExcludeOverrides: [],
    },
  )

  const modifiers = useMemo<PortfolioValueModifier[]>(() => {
    return addressArray.map((addr) => ({
      ownerAddress: addr,
      tokenIncludeOverrides,
      tokenExcludeOverrides,
      includeSmallBalances: !hideSmallBalances,
      includeSpamTokens: !hideSpamTokens,
    }))
  }, [addressArray, tokenIncludeOverrides, tokenExcludeOverrides, hideSmallBalances, hideSpamTokens])

  return modifiers.length > 0 ? modifiers : undefined
}
