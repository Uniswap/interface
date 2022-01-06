import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import dayjs from 'dayjs'
import React from 'react'
import { Button } from 'src/components/buttons/Button'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { useHourlyTokenPrices } from 'src/features/historicalChainData/hooks'
import { formatCurrencyAmount } from 'src/utils/format'

interface TokenBalanceItemProps {
  currencyAmount: CurrencyAmount<Currency>
  currencyPrice: number | undefined
  onPressToken?: (currencyAmount: CurrencyAmount<Currency>) => void
}

export function TokenBalanceItem({
  currencyAmount,
  currencyPrice,
  onPressToken,
}: TokenBalanceItemProps) {
  const { currency } = currencyAmount

  const { prices } = useHourlyTokenPrices({
    token: currency.wrapped,
    periodStartUnix: dayjs().subtract(1, 'day').unix(),
  })

  const percentChange = (function () {
    if (!prices || prices?.length === 0 || !currencyPrice) return null

    const startPrice = prices[prices.length - 1].close
    // TODO: process as `Price`
    const closePrice = currencyPrice

    if (startPrice === 0 && closePrice === 0) return null

    return ((closePrice - startPrice) / startPrice) * 100
  })()

  // TODO: not all tokens have data from the Graph
  const balance = currencyPrice
    ? currencyPrice * parseFloat(currencyAmount.toSignificant())
    : undefined

  const onPress = () => {
    onPressToken?.(currencyAmount)
  }

  return (
    <Button
      onPress={onPress}
      flexDirection="row"
      justifyContent="space-between"
      py="md"
      px="lg"
      bg="white">
      <Box flexDirection="row">
        <CurrencyLogo currency={currency} size={35} />
        <Box mx="md" alignItems="flex-start">
          <Text variant="h4">{currency.symbol}</Text>
          <Text variant="bodySm" color="gray400">{`${formatCurrencyAmount(currencyAmount)} ${
            currency.symbol
          }`}</Text>
        </Box>
      </Box>
      <Box alignItems="flex-end">
        {/* TODO: make currency amount and format */}
        <Text variant="h4">{balance?.toPrecision(6)}</Text>
        <Text
          variant="bodySm"
          color={percentChange ? (percentChange > 0 ? 'green' : 'red') : 'gray600'}>
          {percentChange ? `${percentChange.toFixed(1)}%` : '-'}
        </Text>
      </Box>
    </Button>
  )
}
