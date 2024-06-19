import { Price, Token } from '@ubeswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { useWeb3React } from '@web3-react/core'
import { CELO_CELO, CUSD_CELO, MCUSD_CELO } from 'constants/tokens'
import { useToken } from 'hooks/Tokens'
import { usePairContract } from 'hooks/useContract'
import { useTotalSupply } from 'hooks/useTotalSupply'
import JSBI from 'jsbi'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { useMemo } from 'react'
import { usePair, usePairs } from './Reserves'

type TokenPair = [Token | undefined, Token | undefined]

/**
 * Returns the price in cUSD of the input currency
 * @param currency currency to compute the cUSD price of
 */
export function useCUSDPrices(tokens?: Token[]): (Price<Token, Token> | undefined)[] | undefined {
  const { chainId } = useWeb3React()
  const CUSD = CUSD_CELO
  const celo = CELO_CELO
  const tokenPairs: TokenPair[] = useMemo(
    () =>
      tokens
        ?.map((token) => [
          [token && token.equals(CUSD) ? undefined : token, CUSD],
          [token && token.equals(celo) ? undefined : token, celo],
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
export function useCUSDPrice(token?: Token): Price<Token, Token> | undefined {
  const { chainId } = useWeb3React()
  const CUSD = CUSD_CELO
  const celo = CELO_CELO
  const mcUSD = MCUSD_CELO
  const tokenPairs: [Token | undefined, Token | undefined][] = useMemo(
    () => [
      [token && token.equals(CUSD) ? undefined : token, CUSD],
      [token && token.equals(celo) ? undefined : token, celo],
      [token && mcUSD && token.equals(mcUSD) ? undefined : token, mcUSD ? mcUSD : undefined],
      [celo, CUSD],
    ],
    [CUSD, celo, mcUSD, token]
  )
  const [[, cUSDPair], [, celoPair], [, mcUSDPair], [, celoCUSDPair]] = usePairs(tokenPairs)
  const cusdPairAddr = token ? (token.equals(CUSD) ? undefined : Pair.getAddress(token, CUSD)) : undefined
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
            mcUSDPair.getLiquidityMinted(mcusdPairTotalSupply, mcUSDPair.reserve0, mcUSDPair.reserve1).quotient,
            cUSDPair.getLiquidityMinted(cusdPairTotalSupply, cUSDPair.reserve0, cUSDPair.reserve1).quotient
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

/**
 * Returns the price in cUSD of the input currency
 * @param currency currency to compute the cUSD price of
 */

export const useCUSDPriceOfULP = (stakingToken: Token | undefined): Price<Token, Token> | undefined => {
  const { chainId } = useWeb3React()
  const pair = usePairContract(stakingToken ? stakingToken.address : '')
  const token0Address = useSingleCallResult(pair, 'token0', [])?.result?.[0]
  const token1Address = useSingleCallResult(pair, 'token1', [])?.result?.[0]
  const totalSupplyOfStakingToken = useTotalSupply(stakingToken)
  const token0 = useToken(token0Address) || undefined
  const token1 = useToken(token1Address) || undefined
  const [, stakingTokenPair] = usePair(token0, token1)
  const cusdPrice0 = useCUSDPrice(stakingTokenPair?.token0)
  const cusdPrice1 = useCUSDPrice(stakingTokenPair?.token1)
  const CUSD = CUSD_CELO

  return useMemo(() => {
    if (!stakingToken || !chainId) {
      return undefined
    }

    // handle cUSD
    if (stakingToken.equals(CUSD)) {
      return new Price(CUSD, CUSD, '1', '1')
    }

    if (
      stakingToken &&
      totalSupplyOfStakingToken &&
      !totalSupplyOfStakingToken.equalTo('0') &&
      cusdPrice0 &&
      cusdPrice1 &&
      stakingTokenPair &&
      stakingTokenPair?.reserve0 &&
      stakingTokenPair?.reserve1
    ) {
      const amount0 = cusdPrice0.quote(stakingTokenPair.reserve0)
      const amount1 = cusdPrice1.quote(stakingTokenPair.reserve1)
      const token1CUSDPrice = amount0.asFraction.divide(totalSupplyOfStakingToken.asFraction)
      const token2CUSDPrice = amount1.asFraction.divide(totalSupplyOfStakingToken.asFraction)
      const amount = token1CUSDPrice.add(token2CUSDPrice)
      return new Price(stakingToken, CUSD, amount.denominator, amount.numerator)
    }

    return undefined
  }, [stakingToken, chainId, CUSD, totalSupplyOfStakingToken, cusdPrice0, cusdPrice1, stakingTokenPair])
}
