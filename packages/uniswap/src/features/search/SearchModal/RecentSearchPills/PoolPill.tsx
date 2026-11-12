import { iconSizes } from '@universe/mycelium'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { PoolOption } from 'uniswap/src/components/lists/items/types'
import { getPoolName } from 'uniswap/src/features/pools/names'
import { orderPoolDataByQuoteToken } from 'uniswap/src/features/pools/quoteToken'
import { Pill, PillPressProps } from 'uniswap/src/features/search/SearchModal/RecentSearchPills/Pill'

export function PoolPill({ option, ...pressProps }: PillPressProps & { option: PoolOption }): JSX.Element {
  const { token0CurrencyInfo, token1CurrencyInfo, isToken0Quote, chainId } = option
  const [baseCurrencyInfo, quoteCurrencyInfo] = orderPoolDataByQuoteToken({
    token0IsQuote: isToken0Quote,
    data0: token0CurrencyInfo,
    data1: token1CurrencyInfo,
  })
  const poolName =
    getPoolName({
      symbol0: token0CurrencyInfo.currency.symbol,
      symbol1: token1CurrencyInfo.currency.symbol,
      token0IsQuote: isToken0Quote,
    }) ?? ''
  return (
    <Pill
      label={poolName}
      leading={
        <SplitLogo
          chainId={chainId}
          inputCurrencyInfo={baseCurrencyInfo}
          outputCurrencyInfo={quoteCurrencyInfo}
          size={iconSizes.icon24}
        />
      }
      {...pressProps}
    />
  )
}
