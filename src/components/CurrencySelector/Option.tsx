import { Currency } from '@uniswap/sdk-core'
import React from 'react'
import { Pressable, StyleSheet } from 'react-native'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Box } from 'src/components/layout/Box'
import { CenterBox } from 'src/components/layout/CenterBox'
import { Text } from 'src/components/Text'

interface OptionProps {
  currency: Currency
  onPress: () => void
}

export function Option({ currency, onPress }: OptionProps) {
  return (
    <Pressable onPress={onPress}>
      <Box
        flexDirection="row"
        paddingVertical="sm"
        justifyContent="space-between"
        alignItems="center"
        width="100%">
        <Box flexDirection="row">
          <Box>
            <CurrencyLogo currency={currency} size={20} />
            <CenterBox
              borderRadius="lg"
              padding="xs"
              style={[StyleSheet.absoluteFill, styles.chain]}
              bg="gray600">
              <Text color="white" fontSize={12} fontWeight="500">
                {currency.chainId}
              </Text>
            </CenterBox>
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

const styles = StyleSheet.create({
  chain: {
    height: 20,
    top: 10,
    left: 5,
  },
})
