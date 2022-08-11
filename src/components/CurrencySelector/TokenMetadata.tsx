import React from 'react'
import { CurrencyWithMetadata } from 'src/components/CurrencySelector/types'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { formatCurrencyAmount, formatUSDPrice } from 'src/utils/format'
import { Flex } from '../layout'

interface OptionProps {
  currencyWithMetadata: CurrencyWithMetadata
}

export default function TokenMetadata({ currencyWithMetadata }: OptionProps) {
  const { currencyAmount: amount, balanceUSD } = currencyWithMetadata
  return (
    <Flex row justifyContent="flex-end">
      {amount && !amount.equalTo(0) ? (
        <DataFormatter main={formatCurrencyAmount(amount)} sub={formatUSDPrice(balanceUSD)} />
      ) : null}
    </Flex>
  )
}

interface DataFormatterProps {
  pre?: React.ReactNode
  main: React.ReactNode
  sub?: React.ReactNode
}

/** Helper component to format rhs metadata for a given token. */
function DataFormatter({ pre, main, sub }: DataFormatterProps) {
  return (
    <Flex row>
      {pre}
      <Box alignItems="flex-end" minWidth={70}>
        <Text variant="body">{main}</Text>
        {sub && (
          <Text color="textSecondary" variant="bodySmall">
            {sub}
          </Text>
        )}
      </Box>
    </Flex>
  )
}
