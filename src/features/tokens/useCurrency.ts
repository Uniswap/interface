import { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { NATIVE_ADDRESS, NATIVE_ADDRESS_ALT } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { WRAPPED_NATIVE_CURRENCY } from 'src/constants/tokens'
import { NativeCurrency } from 'src/features/tokenLists/NativeCurrency'
import { useTokenInfoFromAddress } from 'src/features/tokens/useTokenInfoFromAddress'
import { currencyIdToChain } from 'src/utils/currencyId'

/**
 * @param currencyId currency address or identifier (ETH for native Ether)
 */
export function useCurrency(currencyId?: string): NullUndefined<Currency> {
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
