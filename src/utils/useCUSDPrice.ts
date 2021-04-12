import { currencyEquals, cUSD, Price, Token } from '@ubeswap/sdk'
import { useMemo } from 'react'
import { usePairs } from '../data/Reserves'
import { useActiveWeb3React } from '../hooks'

/**
 * Returns the price in cUSD of the input currency
 * @param currency currency to compute the cUSD price of
 */
export default function useCUSDPrice(token?: Token): Price | undefined {
  const { chainId } = useActiveWeb3React()
  const CUSD = cUSD[chainId]
  const tokenPairs: [Token | undefined, Token | undefined][] = useMemo(
    () => [[token && currencyEquals(token, CUSD) ? undefined : token, CUSD]],
    [CUSD, token]
  )
  const [[, cUSDPair]] = usePairs(tokenPairs)

  return useMemo(() => {
    if (!token || !chainId) {
      return undefined
    }

    // handle cUSD
    if (token.equals(CUSD)) {
      return new Price(CUSD, CUSD, '1', '1')
    }

    if (cUSDPair) {
      return cUSDPair.priceOf(token)
    }

    return undefined
  }, [chainId, token, CUSD, cUSDPair])
}
