import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import React from 'react'
import { Button } from 'src/components/buttons/Button'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { useHourlyTokenPrices } from 'src/features/historicalChainData/hooks'

// TODO(#89): use date manipulation util
const d = new Date()
const YESTERDAY = Math.round(d.setDate(d.getDate() - 1))

interface TokenBalanceItemProps {
  currencyAmount: CurrencyAmount<Currency>
  onPressToken: (currencyAmount: CurrencyAmount<Currency>) => void
}

export function TokenBalanceItem({ currencyAmount, onPressToken }: TokenBalanceItemProps) {
  const { currency } = currencyAmount

  const { prices } = useHourlyTokenPrices({
    token: currency.wrapped,
    timestamp: YESTERDAY,
  })

  const percentChange = (function () {
    if (!prices || prices?.length === 0) return null

    const startingPrice = prices[prices.length - 1].close
    const closingPrice = prices[0].close

    if (startingPrice === 0 && closingPrice === 0) return null

    return ((closingPrice - startingPrice) / startingPrice) * 100
  })()

  // TODO: get current price from chain.  Also, not all tokens have data from the Graph
  // Note that for ETH, this gets WETH price.
  const currentPrice = prices && prices?.[0]?.close > 0 ? `$${prices[0].close.toFixed(2)}` : ''

  return (
    <Button
      onPress={() => onPressToken(currencyAmount)}
      flexDirection="row"
      width="100%"
      justifyContent="space-between"
      py="md"
      px="lg">
      <Box flexDirection="row">
        <CurrencyLogo currency={currency} size={40} />
        <Box marginHorizontal="md" alignItems="flex-start">
          <Text fontSize={20} fontWeight="500">
            {currency.symbol}
          </Text>
          <Text fontSize={14} fontWeight="400" color="gray400">{`${currencyAmount.toSignificant(
            6
          )} ${currency.symbol}`}</Text>
        </Box>
      </Box>
      <Box alignItems="flex-end">
        <Text fontSize={20} fontWeight="400">
          {currentPrice}
        </Text>
        <Text
          fontSize={14}
          color={percentChange ? (percentChange > 0 ? 'green' : 'red') : 'gray600'}>
          {percentChange ? `${percentChange.toFixed(1)}%` : '-'}
        </Text>
      </Box>
    </Button>
  )
}
