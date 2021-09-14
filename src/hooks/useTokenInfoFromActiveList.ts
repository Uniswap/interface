import { useMemo } from '@testing-library/react-hooks/node_modules/@types/react'
import { Currency } from '@uniswap/sdk-core'
import { useActiveWeb3React } from 'hooks/web3'
import { useCombinedActiveList } from 'state/lists/hooks'

/**
 * Returns a WrappedTokenInfo from the active token lists when possible,
 * or the passed token otherwise. */
export function useTokenInfoFromActiveList(currency: Currency) {
  const { chainId } = useActiveWeb3React()
  const activeList = useCombinedActiveList()

  return useMemo(() => {
    if (!chainId) return

    try {
      return activeList[chainId][currency.wrapped.address].token
    } catch (e) {
      return currency
    }
  }, [activeList, chainId, currency])
}
