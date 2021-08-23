import { gql, useQuery } from '@apollo/client'
import Decimal from 'decimal.js-light'
import { JSBI, Pair, parseBigintIsh, Percent, Price, PricedToken, PricedTokenAmount, TokenAmount } from '@swapr/sdk'
import { parseUnits } from 'ethers/lib/utils'
import { useMemo } from 'react'
import { useActiveWeb3React } from '.'
import { useNativeCurrency } from './useNativeCurrency'

const QUERY = gql`
  query($pairId: ID) {
    pair(id: $pairId) {
      reserve0
      reserve1
      token0 {
        derivedNativeCurrency
      }
      token1 {
        derivedNativeCurrency
      }
      totalSupply
    }
  }
`

interface QueryResult {
  pair: {
    reserve0: string
    reserve1: string
    totalSupply: string
    token0: { derivedNativeCurrency: string }
    token1: { derivedNativeCurrency: string }
  }
}

export function useLpTokensUnderlyingAssets(
  pair?: Pair,
  lpTokensBalance?: TokenAmount
): { loading: boolean; underlyingAssets?: { token0: PricedTokenAmount; token1: PricedTokenAmount } } {
  const { chainId } = useActiveWeb3React()
  const nativeCurrency = useNativeCurrency()
  const { data, loading, error } = useQuery<QueryResult>(QUERY, {
    variables: {
      pairId: pair ? pair.liquidityToken.address.toLowerCase() : ''
    }
  })

  return useMemo(() => {
    if (loading) return { loading: true, underlyingAssets: undefined }
    if (error || !data || !chainId || !pair || !lpTokensBalance) return { loading: false, underlyingAssets: undefined }

    const { reserve0, reserve1, totalSupply } = data.pair
    const lpTokenDecimals = pair.liquidityToken.decimals // should always be 18, but we explicitly declare this for added safety
    const userPoolShare = new Percent(
      lpTokensBalance.raw.toString(),
      parseUnits(totalSupply, lpTokenDecimals).toString()
    )

    const token0NativeCurrencyPrice = new Price(
      pair.token0,
      nativeCurrency,
      parseUnits('1', nativeCurrency.decimals).toString(),
      parseUnits(
        new Decimal(data.pair.token0.derivedNativeCurrency).toFixed(nativeCurrency.decimals),
        nativeCurrency.decimals
      ).toString()
    )
    const pricedToken0 = new PricedToken(
      chainId,
      pair.token0.address,
      pair.token0.decimals,
      token0NativeCurrencyPrice,
      pair.token0.symbol,
      pair.token0.name
    )
    const rawReserve0Amount = parseUnits(
      new Decimal(reserve0).toFixed(pair.token0.decimals),
      pair.token0.decimals
    ).toString()
    const token0AmountNumerator = JSBI.multiply(parseBigintIsh(rawReserve0Amount), userPoolShare.numerator)
    const token0Amount = new PricedTokenAmount(
      pricedToken0,
      JSBI.divide(token0AmountNumerator, userPoolShare.denominator)
    )

    const token1NativeCurrencyPrice = new Price(
      pair.token1,
      nativeCurrency,
      parseUnits('1', nativeCurrency.decimals).toString(),
      parseUnits(
        new Decimal(data.pair.token1.derivedNativeCurrency).toFixed(nativeCurrency.decimals),
        nativeCurrency.decimals
      ).toString()
    )
    const pricedToken1 = new PricedToken(
      chainId,
      pair.token1.address,
      pair.token1.decimals,
      token1NativeCurrencyPrice,
      pair.token1.symbol,
      pair.token1.name
    )
    const rawReserve1Amount = parseUnits(
      new Decimal(reserve1).toFixed(pair.token1.decimals),
      pair.token1.decimals
    ).toString()
    const token1AmountNumerator = JSBI.multiply(parseBigintIsh(rawReserve1Amount), userPoolShare.numerator)
    const token1Amount = new PricedTokenAmount(
      pricedToken1,
      JSBI.divide(token1AmountNumerator, userPoolShare.denominator)
    )

    return {
      loading: false,
      underlyingAssets: {
        token0: token0Amount,
        token1: token1Amount
      }
    }
  }, [chainId, data, error, loading, lpTokensBalance, nativeCurrency, pair])
}
