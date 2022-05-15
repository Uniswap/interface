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
    <Button bg="none" flexDirection="row" justifyContent="space-between" py="sm" onPress={onPress}>
      <Flex centered row flexShrink={1} gap="sm" overflow="hidden">
        <CurrencyLogo currency={currency} size={40} />
        <Flex alignItems="flex-start" flexShrink={1} gap="xxs">
          <Text ellipsizeMode="tail" numberOfLines={1} variant="mediumLabel">
            {currency.name}
          </Text>
          <Text color="deprecated_gray600" variant="caption">{`${formatCurrencyAmount(amount)} ${
            currency.symbol
          }`}</Text>
        </Flex>
      </Flex>
      <Box alignItems="flex-end" flexBasis="auto">
        <Text variant="mediumLabel">{formatUSDPrice(balance.balanceUSD)}</Text>
        <RelativeChange change={relativeChange24} />
      </Box>
    </Button>
  )
}
