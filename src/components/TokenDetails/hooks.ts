import { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { ChainId } from 'src/constants/chains'
import { useMultipleBalances, useSingleBalance } from 'src/features/dataApi/balances'
import { WrappedTokenInfo } from 'src/features/tokenLists/wrappedTokenInfo'
import { useTokenInfoFromAddress } from 'src/features/tokens/useTokenInfoFromAddress'
import { buildCurrencyId } from 'src/utils/currencyId'
import { getKeys } from 'src/utils/objects'

function useBridgeInfo(currency: Currency) {
  const nativeWrappedCurrency = useTokenInfoFromAddress(
    currency.chainId,
    currency.isNative ? buildCurrencyId(currency.chainId, currency.wrapped.address) : undefined
  )
  return useMemo(
    () =>
      currency instanceof WrappedTokenInfo
        ? currency.bridgeInfo
        : nativeWrappedCurrency instanceof WrappedTokenInfo
        ? nativeWrappedCurrency.bridgeInfo
        : null,
    [currency, nativeWrappedCurrency]
  )
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
