import { Currency } from '@uniswap/sdk-core'
import React from 'react'
import { Pressable } from 'react-native'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'

interface OptionProps {
  currency: Currency
  onPress: () => void
}

export function Option({ currency, onPress }: OptionProps) {
  return (
    <Pressable onPress={onPress}>
      <Box flexDirection="row" justifyContent="space-between" alignItems="center" width="100%">
        <Box flexDirection="row">
          <Box>
            <CurrencyLogo currency={currency} size={20} />
          </Box>
          <Box marginHorizontal="md" alignItems="flex-start" flexDirection="row">
            <Text variant="body">{currency.symbol}</Text>
          </Box>
        </Box>
        <Box alignItems="flex-end">
          <Text variant="body">~$</Text>
          <Text variant="bodySm">-</Text>
        </Box>
      </Box>
    </Pressable>
  )
}
