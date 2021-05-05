import { wrappedCurrency } from 'utils/wrappedCurrency'
import { Currency, Price } from '@uniswap/sdk-core'
import { useV2Pair } from 'hooks/useV2Pairs'
import { useMemo } from 'react'
import { useActiveWeb3React } from 'hooks'

export function useV2SpotPrice({
  currencyA,
  currencyB,
  baseCurrency,
}: {
  currencyA: Currency | undefined | null
  currencyB: Currency | undefined | null
  baseCurrency?: Currency | undefined | null // optional if want adjusted to base currency
}): {
  v2SpotPrice: Price | undefined
  v2SpotPriceAdjustedToBase: Price | undefined
} {
  const { chainId } = useActiveWeb3React()
  const [, v2Pair] = useV2Pair(currencyA ?? undefined, currencyB ?? undefined)
  const [tokenA, tokenB, baseToken] = useMemo(
    () => [
      wrappedCurrency(currencyA ?? undefined, chainId),
      wrappedCurrency(currencyB ?? undefined, chainId),
      wrappedCurrency(baseCurrency ?? undefined, chainId),
    ],
    [chainId, currencyA, currencyB, baseCurrency]
  )
  const [token0, token1] = useMemo(
    () =>
      tokenA && tokenB ? (tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]) : [undefined, undefined],
    [tokenA, tokenB]
  )
  const v2SpotPrice = useMemo(() => {
    if (token0 && token1 && v2Pair) {
      return new Price(token0, token1, v2Pair.reserve0.raw, v2Pair.reserve1.raw)
    }
    return undefined
  }, [token0, token1, v2Pair])

  // check to invert depending on base
  const v2SpotPriceAdjustedToBase =
    baseToken && token0 && v2SpotPrice ? (baseToken.equals(token0) ? v2SpotPrice : v2SpotPrice.invert()) : undefined

  return {
    v2SpotPrice,
    v2SpotPriceAdjustedToBase,
  }
}
