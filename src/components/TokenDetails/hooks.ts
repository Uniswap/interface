import { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useHomeStackNavigation } from 'src/app/navigation/types'
import { Chain, useTokenDetailsScreenLazyQuery } from 'src/data/__generated__/types-and-hooks'
import { useMultipleBalances, useSingleBalance } from 'src/features/dataApi/balances'
import { currencyIdToContractInput } from 'src/features/dataApi/utils'
import { Screens } from 'src/screens/Screens'
import { fromGraphQLChain } from 'src/utils/chainId'
import { buildCurrencyId, buildNativeCurrencyId, CurrencyId } from 'src/utils/currencyId'

/** Helper hook to retrieve balances across chains for a given currency, for the active account. */
export function useCrossChainBalances(
  currency: Currency,
  bridgeInfo: NullUndefined<{ chain: Chain; address?: NullUndefined<string> }[]>
) {
  const currentChainBalance = useSingleBalance(currency)

  const bridgedCurrencyIds = useMemo(
    () =>
      bridgeInfo
        ?.map(({ chain, address }) => {
          const chainId = fromGraphQLChain(chain)
          if (!chainId || chainId === currency.chainId) return null
          if (!address) return buildNativeCurrencyId(chainId)
          return buildCurrencyId(chainId, address)
        })
        .filter((b): b is string => !!b),

    [bridgeInfo, currency.chainId]
  )
  const otherChainBalances = useMultipleBalances(bridgedCurrencyIds)

  return {
    currentChainBalance,
    otherChainBalances,
  }
}

/** Utility hook to simplify navigating to token details screen */
export function useTokenDetailsNavigation() {
  const navigation = useHomeStackNavigation()
  const [load] = useTokenDetailsScreenLazyQuery()

  const preload = (currencyId: CurrencyId) => {
    load({
      variables: {
        contract: currencyIdToContractInput(currencyId),
      },
    })
  }

  const navigate = (currencyId: CurrencyId) => {
    // the desired behavior is to push the new token details screen onto the stack instead of replacing it
    // however, `push` could create an infinitely deep navigation stack that is hard to get out of
    // for that reason, we first `pop` token details from the stack, and then push it.
    if (navigation.canGoBack()) {
      navigation.pop()
    }
    navigation.push(Screens.TokenDetails, { currencyId })
  }

  return { preload, navigate }
}
