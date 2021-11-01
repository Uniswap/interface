import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import React from 'react'
import { Button } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'

interface TokenBalanceItemProps {
  balance: CurrencyAmount<Currency> | null
}

// TODO: balance maybe don't make null?
export function TokenBalanceItem({ balance }: TokenBalanceItemProps) {
  // TODO get actual price and return

  return (
    <Button
      backgroundColor="white"
      flexDirection="row"
      width="100%"
      justifyContent="space-between"
      marginVertical="sm">
      <Box flexDirection="row">
        <Box width={40} height={40} borderRadius="full" backgroundColor="blue" />
        <Box marginHorizontal="sm" alignItems="flex-start">
          <Text fontSize={20} fontWeight="500">
            {balance?.currency.symbol}
          </Text>
          <Text fontSize={14} fontWeight="400" color="gray400">{`${balance?.toSignificant(6)} ${
            balance?.currency.symbol
          }`}</Text>
        </Box>
      </Box>
      <Box alignItems="flex-end">
        <Text fontSize={20} fontWeight="400">
          $9000.32
        </Text>
        <Text fontSize={14} color={'green'}>
          +9.55%
        </Text>
      </Box>
    </Button>
  )
}
