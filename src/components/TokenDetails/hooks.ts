import { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { ChainId } from 'src/constants/chains'
import { nativeOnChain } from 'src/constants/tokens'
import { useActiveChainIds } from 'src/features/chains/utils'
import { useMultipleBalances, useSingleBalance } from 'src/features/dataApi/balances'
import { BridgeInfo, WrappedTokenInfo } from 'src/features/tokenLists/wrappedTokenInfo'
import { useTokenInfoFromAddress } from 'src/features/tokens/useTokenInfoFromAddress'
import { buildCurrencyId, currencyAddress } from 'src/utils/currencyId'
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
