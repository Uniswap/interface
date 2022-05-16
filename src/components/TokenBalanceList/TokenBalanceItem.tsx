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
    <Button bg="none" flexDirection="row" justifyContent="space-between" py="xs" onPress={onPress}>
      <Flex row alignItems={'center'} flexShrink={1} gap="xs" overflow="hidden">
        <CurrencyLogo currency={currency} size={36} />
        <Flex alignItems="flex-start" flexShrink={1} gap="none">
          <Text ellipsizeMode="tail" numberOfLines={1} variant="subHead1">
            {currency.symbol}
          </Text>
          <Text color="neutralTextSecondary" variant="caption">{`${formatCurrencyAmount(
            amount
          )} `}</Text>
        </Flex>
      </Flex>
      <Box alignItems="flex-end" flexBasis="auto" flexShrink={1}>
        <Text variant="subHead1">{formatUSDPrice(balance.balanceUSD)}</Text>
        <RelativeChange change={relativeChange24} />
      </Box>
    </Button>
  )
}
