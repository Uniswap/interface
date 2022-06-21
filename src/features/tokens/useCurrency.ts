import { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { NATIVE_ADDRESS, NATIVE_ADDRESS_ALT } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { WRAPPED_NATIVE_CURRENCY } from 'src/constants/tokens'
import { useCoinIdAndCurrencyIdMappings } from 'src/features/dataApi/coingecko/hooks'
import { NativeCurrency } from 'src/features/tokenLists/NativeCurrency'
import { useTokenInfoFromAddress } from 'src/features/tokens/useTokenInfoFromAddress'
import { buildCurrencyId, currencyIdToChain } from 'src/utils/currencyId'

/**
 * @param currencyId currency address or identifier (ETH for native Ether)
 */
export function useCurrency(currencyId?: string): Nullable<Currency> {
  const chainId = currencyIdToChain(currencyId)
  const isNative = currencyId?.endsWith(NATIVE_ADDRESS) || currencyId?.endsWith(NATIVE_ADDRESS_ALT)
  const token = useTokenInfoFromAddress(
    chainId ?? ChainId.Mainnet,
    isNative ? undefined : currencyId
  )
  const extendedEther = useMemo(
    // `NativeCurrency.onChain` returns a new object each render
    // memoize to avoid unnecessary renders
    () =>
      chainId
        ? NativeCurrency.onChain(chainId)
        : // display mainnet when not connected
          NativeCurrency.onChain(ChainId.Mainnet),
    [chainId]
  )
  const weth = chainId ? WRAPPED_NATIVE_CURRENCY[chainId] : undefined
  if (currencyId === null || currencyId === undefined) return currencyId
  if (weth?.address?.toUpperCase() === currencyId?.toUpperCase()) return weth
  return isNative ? extendedEther : token
}

// TODO: consider moving this logic to the data backend
export function useCurrencyIdFromCoingeckoId(coingeckoId?: string): Nullable<string> {
  const { coinIdToCurrencyIds, isLoading } = useCoinIdAndCurrencyIdMappings()

  return useMemo(() => {
    // HACK: add native ETH mapping in hook as I couldn't figure out how to add it to the cache
    //       data backend should handle this case regardless / we can improve locally when data
    //       backend is ready
    if (coingeckoId === 'ethereum') return buildCurrencyId(ChainId.Mainnet, NATIVE_ADDRESS)

    if (isLoading || !coingeckoId) return undefined

    // always default to mainnet
    if (coinIdToCurrencyIds[coingeckoId][ChainId.Mainnet])
      return coinIdToCurrencyIds[coingeckoId][ChainId.Mainnet]

    // if mainnet address not provided, then return any
    Object.values(coinIdToCurrencyIds[coingeckoId])[0]
  }, [coinIdToCurrencyIds, coingeckoId, isLoading])
}
