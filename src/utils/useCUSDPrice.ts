import { useContractKit } from '@celo-tools/use-contractkit'
import { CELO, ChainId as UbeswapChainId, currencyEquals, cUSD, JSBI, Pair, Price, Token } from '@ubeswap/sdk'
import { useTotalSupply } from 'data/TotalSupply'
import { useToken } from 'hooks/Tokens'
import { useMemo } from 'react'

import { MCUSD } from '../constants/index'
import { usePairs } from '../data/Reserves'

type TokenPair = [Token | undefined, Token | undefined]

/**
 * Returns the price in cUSD of the input currency
 * @param currency currency to compute the cUSD price of
 */
export function useCUSDPrices(tokens?: Token[]): (Price | undefined)[] | undefined {
  const {
    network: { chainId },
  } = useContractKit()
  const CUSD = cUSD[chainId as unknown as UbeswapChainId]
  const celo = CELO[chainId as unknown as UbeswapChainId]
  const tokenPairs: TokenPair[] = useMemo(
    () =>
      tokens
        ?.map((token) => [
          [token && currencyEquals(token, CUSD) ? undefined : token, CUSD],
          [token && currencyEquals(token, celo) ? undefined : token, celo],
          [celo, CUSD],
        ])
        .flat() as TokenPair[],
    [CUSD, celo, tokens]
  )
  const thesePairs = usePairs(tokenPairs)

  return useMemo(() => {
    if (!tokens || !chainId) {
      return undefined
    }
    const pairs = thesePairs.map((x) => x[1])

    return tokens.map((token, idx) => {
      const start = idx * 3
      const [cUSDPair, celoPair, celoCUSDPair] = [pairs[start], pairs[start + 1], pairs[start + 2]]

      // handle cUSD
      if (token.equals(CUSD)) {
        return new Price(CUSD, CUSD, '1', '1')
      }

      if (cUSDPair) {
        return cUSDPair.priceOf(token)
      }

      if (celoPair && celoCUSDPair) {
        return celoPair.priceOf(token).multiply(celoCUSDPair.priceOf(celo))
      }

      return undefined
    })
  }, [chainId, tokens, CUSD, celo, thesePairs])
}

/**
 * Returns the price in cUSD of the input currency
 * @param token the token to get the cUSD price of
 */
export function useCUSDPrice(token?: Token): Price | undefined {
  const {
    network: { chainId },
  } = useContractKit()
  const CUSD = cUSD[chainId as unknown as UbeswapChainId]
  const celo = CELO[chainId as unknown as UbeswapChainId]
  const mcUSD = MCUSD[chainId as unknown as UbeswapChainId]
  const tokenPairs: [Token | undefined, Token | undefined][] = useMemo(
    () => [
      [token && currencyEquals(token, CUSD) ? undefined : token, CUSD],
      [token && currencyEquals(token, celo) ? undefined : token, celo],
      [token && mcUSD && currencyEquals(token, mcUSD) ? undefined : token, mcUSD ? mcUSD : undefined],
      [celo, CUSD],
    ],
    [CUSD, celo, mcUSD, token]
  )
  const [[, cUSDPair], [, celoPair], [, mcUSDPair], [, celoCUSDPair]] = usePairs(tokenPairs)
  const cusdPairAddr = token ? Pair.getAddress(token, CUSD) : undefined
  const cusdPairTotalSupply = useTotalSupply(useToken(cusdPairAddr) || undefined)
  const mcusdPairAddr = token && mcUSD && token.address !== mcUSD.address ? Pair.getAddress(token, mcUSD) : undefined
  const mcusdPairTotalSupply = useTotalSupply(useToken(mcusdPairAddr) || undefined)

  return useMemo(() => {
    if (!token || !chainId) {
      return undefined
    }

    // handle cUSD
    if (token.equals(CUSD)) {
      return new Price(CUSD, CUSD, '1', '1')
    }

    if (mcUSDPair && cUSDPair && cusdPairTotalSupply && mcusdPairTotalSupply) {
      try {
        if (
          JSBI.greaterThan(
            mcUSDPair.getLiquidityMinted(mcusdPairTotalSupply, mcUSDPair.reserve0, mcUSDPair.reserve1).raw,
            cUSDPair.getLiquidityMinted(cusdPairTotalSupply, cUSDPair.reserve0, cUSDPair.reserve1).raw
          )
        ) {
          return mcUSDPair.priceOf(token)
        }
      } catch (e: any) {
        if (e.message != 'Invariant failed: LIQUIDITY') {
          console.log(e)
        }
      }
    }

    if (cUSDPair) {
      return cUSDPair.priceOf(token)
    }

    if (celoPair && celoCUSDPair) {
      return celoPair.priceOf(token).multiply(celoCUSDPair.priceOf(celo))
    }

    return undefined
  }, [
    chainId,
    token,
    CUSD,
    cUSDPair,
    celo,
    celoCUSDPair,
    celoPair,
    mcUSDPair,
    cusdPairTotalSupply,
    mcusdPairTotalSupply,
  ])
}
