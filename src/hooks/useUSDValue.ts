import {
  Token,
  Trade,
  currencyEquals,
  Price,
  CurrencyAmount,
  JSBI,
  ZERO,
  ONE,
  Fraction,
  RoutablePlatform
} from '@swapr/sdk'
import { useTradeExactInAllPlatforms } from './Trades'
import { ChainId } from '@swapr/sdk'
import { USDC, DAI } from '../constants/index'
import { useActiveWeb3React } from './index'
import { useMemo } from 'react'

const STABLECOIN_OUT: { [chainId: number]: Token } = {
  [ChainId.MAINNET]: DAI,
  [ChainId.ARBITRUM_ONE]: USDC[ChainId.ARBITRUM_ONE],
  [ChainId.XDAI]: USDC[ChainId.XDAI]
}

const ALLOWED_PLATAFORMS: { [chainId: number]: string[] } = {
  [ChainId.MAINNET]: [RoutablePlatform.UNISWAP.name, RoutablePlatform.SUSHISWAP.name],
  [ChainId.ARBITRUM_ONE]: [RoutablePlatform.SUSHISWAP.name],
  [ChainId.XDAI]: [RoutablePlatform.SUSHISWAP.name]
}

export function useUSDPrice(currencyAmount?: CurrencyAmount, selectedTrade?: Trade) {
  const { chainId } = useActiveWeb3React()
  const stablecoin = chainId ? STABLECOIN_OUT[chainId] : undefined

  const tradeExactOutAllPlatforms = useTradeExactInAllPlatforms(currencyAmount, stablecoin)

  return useMemo(() => {
    if (!currencyAmount || !chainId || !stablecoin || !tradeExactOutAllPlatforms) return undefined

    const currency = currencyAmount.currency

    if (currencyEquals(currency, stablecoin)) return new Price(currency, currency, '1', '1')

    const allowHighTVLPlataforms = (trade: Trade | undefined) => {
      if (!trade) return false
      if (selectedTrade) return selectedTrade.platform.name === trade.platform.name
      else return ALLOWED_PLATAFORMS[chainId].includes(trade.platform.name)
    }

    const calculateBestPrice = (trades: (Trade | undefined)[]): Price | undefined => {
      if (!trades || !trades.length) return undefined

      const topTrade = trades.filter(allowHighTVLPlataforms)
      console.log(topTrade)
      const tradesTotal = topTrade.reduce(
        (acc, trade) => (trade ? trade.executionPrice.raw.add(acc) : acc),
        new Fraction(ZERO, ONE)
      )

      const { numerator, denominator } = tradesTotal.divide(JSBI.BigInt(topTrade.length))

      return new Price(currency, stablecoin, denominator, numerator)
    }

    return calculateBestPrice(tradeExactOutAllPlatforms)
  }, [chainId, currencyAmount, selectedTrade, stablecoin, tradeExactOutAllPlatforms])
}

export function useUSDValue(currencyAmount?: CurrencyAmount | null, selectedTrade?: Trade) {
  const price = useUSDPrice(currencyAmount || undefined, selectedTrade)

  return useMemo(() => {
    if (!price || !currencyAmount) return null

    try {
      return price.quote(currencyAmount)
    } catch (error) {
      return null
    }
  }, [currencyAmount, price])
}
