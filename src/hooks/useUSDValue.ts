import {
  Token,
  Trade,
  currencyEquals,
  Price,
  Currency,
  CurrencyAmount,
  JSBI,
  ZERO,
  ONE,
  Fraction,
  RoutablePlatform
} from '@swapr/sdk'
import { useTradeExactOutAllPlatforms } from './Trades'
import { tryParseAmount } from '../state/swap/hooks'
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

const AMOUNT_OUT = '1'

export function useUSDPrice(currency?: Currency, selectedTrade?: Trade) {
  const { chainId } = useActiveWeb3React()
  const stablecoin = chainId ? STABLECOIN_OUT[chainId] : undefined
  const parsedAmountOut = tryParseAmount(AMOUNT_OUT, stablecoin, chainId)

  const tradeExactOutAllPlatforms = useTradeExactOutAllPlatforms(currency, parsedAmountOut)

  return useMemo(() => {
    if (!currency || !chainId || !stablecoin || !tradeExactOutAllPlatforms) return undefined

    if (currencyEquals(currency, stablecoin)) return new Price(currency, currency, '1', '1')

    const allowHighTVLPlataforms = (trade: Trade | undefined) => {
      if (!trade) return false
      if (selectedTrade) return selectedTrade.platform.name === trade.platform.name
      else return ALLOWED_PLATAFORMS[chainId].includes(trade.platform.name)
    }

    const calculateBestPrice = (trades: (Trade | undefined)[]): Price | undefined => {
      if (!trades || !trades.length) return undefined

      const topTrade = trades.filter(allowHighTVLPlataforms)

      const tradesTotal = topTrade.reduce(
        (acc, trade) => (trade ? trade.nextMidPrice.raw.add(acc) : acc),
        new Fraction(ZERO, ONE)
      )

      const { numerator, denominator } = tradesTotal.divide(JSBI.BigInt(topTrade.length))

      return new Price(currency, stablecoin, denominator, numerator)
    }

    return calculateBestPrice(tradeExactOutAllPlatforms)
  }, [chainId, currency, selectedTrade, stablecoin, tradeExactOutAllPlatforms])
}

export function useUSDValue(currencyAmount: CurrencyAmount | undefined | null, selectedTrade?: Trade) {
  const price = useUSDPrice(currencyAmount?.currency, selectedTrade)

  return useMemo(() => {
    if (!price || !currencyAmount) return null

    try {
      return price.quote(currencyAmount)
    } catch (error) {
      return null
    }
  }, [currencyAmount, price])
}
