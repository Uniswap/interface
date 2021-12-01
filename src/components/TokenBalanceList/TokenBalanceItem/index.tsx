import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import React from 'react'
import { Button } from 'src/components/buttons/Button'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { useHourlyTokenPrices } from 'src/features/historicalChainData/hooks'
import useUSDCPrice from 'src/features/prices/useUSDCPrice'
import { formatCurrencyAmount } from 'src/utils/format'

// TODO(#89): use date manipulation util
const d = new Date()
const YESTERDAY = Math.round(d.setDate(d.getDate() - 1))

interface TokenBalanceItemProps {
  currencyAmount: CurrencyAmount<Currency>
  onPressToken: (currencyAmount: CurrencyAmount<Currency>) => void
}

export function TokenBalanceItem({ currencyAmount, onPressToken }: TokenBalanceItemProps) {
  const { currency } = currencyAmount

  const currentPrice = useUSDCPrice(currency)
  const { prices } = useHourlyTokenPrices({
    token: currency.wrapped,
    timestamp: YESTERDAY,
  })

  const percentChange = (function () {
    if (!prices || prices?.length === 0 || !currentPrice) return null

    const startPrice = prices[prices.length - 1].close
    // TODO: process as `Price`
    const closePrice = parseFloat(currentPrice.toSignificant(6))

    if (startPrice === 0 && closePrice === 0) return null

    return ((closePrice - startPrice) / startPrice) * 100
  })()

  // TODO: not all tokens have data from the Graph
  // Note that for ETH, this gets WETH price.
  const balance = currentPrice ? `$${currentPrice.quote(currencyAmount).toFixed(2)}` : '-'

  return (
    <Button onPress={() => onPressToken(currencyAmount)} flexDirection="row" py="md">
      <Box flex={1} flexDirection="row" justifyContent="space-between" mx="md">
        <Box flexDirection="row">
          <CurrencyLogo currency={currency} size={40} />
          <Box mx="md" alignItems="flex-start">
            <Text fontSize={20} fontWeight="500">
              {currency.symbol}
            </Text>
            <Text fontSize={14} fontWeight="400" color="gray400">{`${formatCurrencyAmount(
              currencyAmount
            )} ${currency.symbol}`}</Text>
          </Box>
        </Box>
        <Box alignItems="flex-end">
          <Text fontSize={20} fontWeight="400">
            {balance}
          </Text>
          <Text
            fontSize={14}
            color={percentChange ? (percentChange > 0 ? 'green' : 'red') : 'gray600'}>
            {percentChange ? `${percentChange.toFixed(1)}%` : '-'}
          </Text>
        </Box>
      </Box>
    </Button>
  )
}
