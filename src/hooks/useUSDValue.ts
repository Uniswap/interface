import { Token, Trade, currencyEquals, Price, CurrencyAmount } from '@swapr/sdk'
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

export function useUSDPrice(currencyAmount?: CurrencyAmount, selectedTrade?: Trade) {
  const { chainId } = useActiveWeb3React()
  const stablecoin = chainId ? STABLECOIN_OUT[chainId] : undefined

  const tradeExactOutAllPlatforms = useTradeExactInAllPlatforms(currencyAmount, stablecoin)

  return useMemo(() => {
    if (!currencyAmount || !chainId || !stablecoin || !tradeExactOutAllPlatforms) return undefined

    const currency = currencyAmount.currency

    if (currencyEquals(currency, stablecoin)) return new Price(currency, currency, '1', '1')

    const filterSelectedPlataforms = (trade: Trade | undefined) => {
      if (!trade || !selectedTrade) return false
      return selectedTrade.platform.name === trade.platform.name
    }

    const calculateBestPrice = (trades: (Trade | undefined)[]): Price | undefined => {
      if (!trades || !trades.length) return undefined

      const selectedPlataformTrade = trades.filter(filterSelectedPlataforms)[0]

      if (!selectedPlataformTrade) return undefined

      const { numerator, denominator } = selectedPlataformTrade?.executionPrice

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
