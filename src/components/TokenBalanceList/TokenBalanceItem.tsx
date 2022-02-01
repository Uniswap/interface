import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import dayjs from 'dayjs'
import React from 'react'
import { Button } from 'src/components/buttons/Button'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { useHourlyTokenPrices } from 'src/features/historicalChainData/hooks'
import { formatCurrencyAmount, formatUSDPrice } from 'src/utils/format'

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

    if (startPrice === 0 || closePrice === 0) return null

    return ((closePrice - startPrice) / startPrice) * 100
  })()

  // TODO: not all tokens have data from the Graph
  const balance =
    currencyPrice !== undefined
      ? currencyPrice * parseFloat(currencyAmount.toSignificant())
      : undefined

  const onPress = () => {
    onPressToken?.(currencyAmount)
  }

  return (
    <Button
      bg="none"
      flexDirection="row"
      justifyContent="space-between"
      px="lg"
      py="sm"
      onPress={onPress}>
      <Flex centered row gap="sm">
        <CurrencyLogo currency={currency} size={32} />
        <Box alignItems="flex-start">
          <Text variant="h4">{currency.symbol}</Text>
          <Text color="gray600" variant="bodySm">{`${formatCurrencyAmount(currencyAmount)} ${
            currency.symbol
          }`}</Text>
        </Box>
      </Flex>
      <Box alignItems="flex-end">
        <Text variant="h4">{formatUSDPrice(balance)}</Text>
        <Text
          color={percentChange ? (percentChange > 0 ? 'green' : 'red') : 'gray600'}
          variant="bodySm">
          {percentChange ? `${percentChange.toFixed(1)}%` : '-'}
        </Text>
      </Box>
    </Button>
  )
}
