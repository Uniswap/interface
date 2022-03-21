import { Currency } from '@uniswap/sdk-core'
import React from 'react'
import { Button } from 'src/components/buttons/Button'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { RelativeChange } from 'src/components/text/RelativeChange'
import { PortfolioBalance } from 'src/features/dataApi/types'
import { formatCurrencyAmount, formatUSDPrice } from 'src/utils/format'

interface TokenBalanceItemProps {
  balance: PortfolioBalance
  onPressToken?: (currency: Currency) => void
}

export function TokenBalanceItem({ balance, onPressToken }: TokenBalanceItemProps) {
  const { amount, relativeChange24 } = balance
  const { currency } = amount

  const onPress = () => {
    onPressToken?.(currency)
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
        <CurrencyLogo currency={currency} size={40} />
        <Flex alignItems="flex-start" gap="xxs">
          <Text variant="h4">{currency.name}</Text>
          <Text color="gray600" variant="bodySm">{`${formatCurrencyAmount(amount)} ${
            currency.symbol
          }`}</Text>
        </Flex>
      </Flex>
      <Box alignItems="flex-end">
        <Text variant="h4">{formatUSDPrice(balance.balanceUSD)}</Text>
        <RelativeChange change={relativeChange24} />
      </Box>
    </Button>
  )
}
