import { Currency, Ether, WETH9 } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { ChainId } from 'src/constants/chains'
import { useTokenInfoFromAddress } from 'src/features/tokens/useTokenInfoFromAddress'

/**
 * @param currencyId currency address or identifier (ETH for native Ether)
 */
export function useCurrency(
  currencyId: string | null | undefined,
  chainId: ChainId | null | undefined
): Currency | null | undefined {
  const isETH = currencyId?.toUpperCase() === 'ETH'
  const token = useTokenInfoFromAddress(chainId ?? ChainId.MAINNET, isETH ? undefined : currencyId)
  const extendedEther = useMemo(
    // `Ether.onChain` returns a new object each render
    // memoize to avoid unnecessary renders
    () =>
      chainId
        ? Ether.onChain(chainId)
        : // display mainnet when not connected
          Ether.onChain(ChainId.MAINNET),
    [chainId]
  )
  const weth = chainId ? WETH9[chainId] : undefined
  if (currencyId === null || currencyId === undefined) return currencyId
  if (weth?.address?.toUpperCase() === currencyId?.toUpperCase()) return weth
  return isETH ? extendedEther : token
}
