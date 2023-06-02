import { useMemo } from 'react'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { useBalances } from 'src/features/dataApi/balances'
import { Screens } from 'src/screens/Screens'
import {
  Chain,
  useTokenDetailsScreenLazyQuery,
} from 'wallet/src/data/__generated__/types-and-hooks'
import { PortfolioBalance } from 'wallet/src/features/dataApi/types'
import { currencyIdToContractInput } from 'wallet/src/features/dataApi/utils'
import { fromGraphQLChain } from 'wallet/src/utils/chainId'
import {
  buildCurrencyId,
  buildNativeCurrencyId,
  CurrencyId,
  currencyIdToChain,
} from 'wallet/src/utils/currencyId'

/** Helper hook to retrieve balances across chains for a given currency, for the active account. */
export function useCrossChainBalances(
  currencyId: string,
  bridgeInfo: Maybe<{ chain: Chain; address?: Maybe<string> }[]>
): {
  currentChainBalance: PortfolioBalance | null
  otherChainBalances: PortfolioBalance[] | null
} {
  const currentChainBalance = useBalances([currencyId])?.[0] ?? null
  const currentChainId = currencyIdToChain(currencyId)

  const bridgedCurrencyIds = useMemo(
    () =>
      bridgeInfo
        ?.map(({ chain, address }) => {
          const chainId = fromGraphQLChain(chain)
          if (!chainId || chainId === currentChainId) return null
          if (!address) return buildNativeCurrencyId(chainId)
          return buildCurrencyId(chainId, address)
        })
        .filter((b): b is string => !!b),

    [bridgeInfo, currentChainId]
  )
  const otherChainBalances = useBalances(bridgedCurrencyIds)

  return {
    currentChainBalance,
    otherChainBalances,
  }
}

/** Utility hook to simplify navigating to token details screen */
export function useTokenDetailsNavigation(): {
  preload: (currencyId: CurrencyId) => void
  navigate: (currencyId: CurrencyId) => void
  navigateWithPop: (currencyId: CurrencyId) => void
} {
  const navigation = useAppStackNavigation()
  const [load] = useTokenDetailsScreenLazyQuery()

  const preload = (currencyId: CurrencyId): void => {
    load({
      variables: currencyIdToContractInput(currencyId),
    })
  }

  // the desired behavior is to push the new token details screen onto the stack instead of replacing it
  // however, `push` could create an infinitely deep navigation stack that is hard to get out of
  // for that reason, we first `pop` token details from the stack, and then push it.
  //
  // Use whenever we want to avoid nested token details screens in the nav stack.
  const navigateWithPop = (currencyId: CurrencyId): void => {
    if (navigation.canGoBack()) {
      navigation.pop()
    }
    navigation.push(Screens.TokenDetails, { currencyId })
  }

  const navigate = (currencyId: CurrencyId): void => {
    navigation.navigate(Screens.TokenDetails, { currencyId })
  }

  return { preload, navigate, navigateWithPop }
}
