import { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useHomeStackNavigation } from 'src/app/navigation/types'
import { ChainId } from 'src/constants/chains'
import { nativeOnChain } from 'src/constants/tokens'
import { useTokenDetailsScreenLazyQuery } from 'src/data/__generated__/types-and-hooks'
import { useActiveChainIds } from 'src/features/chains/utils'
import { useMultipleBalances, useSingleBalance } from 'src/features/dataApi/balances'
import { currencyIdToContractInput } from 'src/features/dataApi/utils'
import { BridgeInfo, WrappedTokenInfo } from 'src/features/tokenLists/wrappedTokenInfo'
import { useTokenInfoFromAddress } from 'src/features/tokens/useTokenInfoFromAddress'
import { Screens } from 'src/screens/Screens'
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
