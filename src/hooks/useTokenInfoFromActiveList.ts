import { Currency } from '@uniswap/sdk-core'
import { useActiveWeb3React } from 'hooks/web3'
import { useMemo } from 'react'
import { useCombinedActiveList } from 'state/lists/hooks'

/**
 * Returns a WrappedTokenInfo from the active token lists when possible,
 * or the passed token otherwise. */
export function useTokenInfoFromActiveList(currency: Currency) {
  const { chainId } = useActiveWeb3React()
  const activeList = useCombinedActiveList()

  return useMemo(() => {
    if (!chainId) return
    if (currency.isNative) return currency

    try {
      return activeList[chainId][currency.wrapped.address].token
    } catch (e) {
      return currency
    }
  }, [activeList, chainId, currency])
}
