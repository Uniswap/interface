import { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useEagerNavigation } from 'src/app/navigation/useEagerNavigation'
import { ChainId } from 'src/constants/chains'
import { nativeOnChain } from 'src/constants/tokens'
import { preloadMapping } from 'src/data/preloading'
import { useActiveChainIds } from 'src/features/chains/utils'
import { useMultipleBalances, useSingleBalance } from 'src/features/dataApi/balances'
import { BridgeInfo, WrappedTokenInfo } from 'src/features/tokenLists/wrappedTokenInfo'
import { useTokenInfoFromAddress } from 'src/features/tokens/useTokenInfoFromAddress'
import { Screens } from 'src/screens/Screens'
import { tokenDetailsScreenQuery } from 'src/screens/TokenDetailsScreen'
import { TokenDetailsScreenQuery } from 'src/screens/__generated__/TokenDetailsScreenQuery.graphql'
import { buildCurrencyId, currencyAddress, CurrencyId } from 'src/utils/currencyId'
import { getKeys } from 'src/utils/objects'

function useBridgeInfo(currency: Currency) {
  const activeChainIds = useActiveChainIds()

  const nativeWrappedCurrency = useTokenInfoFromAddress(
    currency.chainId,
    currency.isToken ? buildCurrencyId(currency.chainId, currency.address) : undefined
  )

  return useMemo(() => {
    if (currency.isNative) {
      return activeChainIds.reduce<BridgeInfo>((acc, chain) => {
        if (chain === currency.chainId) {
          return acc
        }

        const etherOnChain = nativeOnChain(chain)

        if (etherOnChain.symbol !== currency.symbol) {
          return acc
        }

        acc[chain] = {
          tokenAddress: currencyAddress(etherOnChain),
        }
        return acc
      }, {})
    }

    if (currency instanceof WrappedTokenInfo) {
      return currency.bridgeInfo
    }

    if (nativeWrappedCurrency instanceof WrappedTokenInfo) {
      return nativeWrappedCurrency.bridgeInfo
    }
  }, [activeChainIds, currency, nativeWrappedCurrency])
}

/** Helper hook to retrieve balances across chains for a given currency, for the active account. */
export function useCrossChainBalances(currency: Currency) {
  const currentChainBalance = useSingleBalance(currency)

  const bridgeInfo = useBridgeInfo(currency)
  const bridgedCurrencyIds = useMemo(
    () =>
      getKeys(bridgeInfo ?? {}).map((chain: ChainId) =>
        buildCurrencyId(chain, bridgeInfo?.[chain]?.tokenAddress ?? '')
      ),
    [bridgeInfo]
  )
  const otherChainBalances = useMultipleBalances(bridgedCurrencyIds)

  return {
    currentChainBalance,
    otherChainBalances,
  }
}

/** Utility hook to simplify navigating to token details screen */
export function useTokenDetailsNavigation() {
  const { registerNavigationIntent, preloadedNavigate } =
    useEagerNavigation<TokenDetailsScreenQuery>(tokenDetailsScreenQuery)

  const preload = (currencyId: CurrencyId) => {
    registerNavigationIntent(
      preloadMapping.tokenDetails({
        currencyId,
      })
    )
  }

  const navigate = (currencyId: CurrencyId) => {
    preloadedNavigate(Screens.TokenDetails, { currencyId })
  }

  return { preload, navigate }
}
