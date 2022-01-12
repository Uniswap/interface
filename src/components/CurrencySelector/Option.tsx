import { Currency } from '@uniswap/sdk-core'
import React from 'react'
import { Pressable } from 'react-native'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Box } from 'src/components/layout/Box'
import { CenterBox } from 'src/components/layout/CenterBox'
import { Text } from 'src/components/Text'
import { ChainId, CHAIN_INFO } from 'src/constants/chains'
import { useNetworkColors } from 'src/utils/colors'

interface OptionProps {
  currency: Currency
  onPress: () => void
  selected: boolean
}

export function Option({ currency, onPress }: OptionProps) {
  const info = CHAIN_INFO[currency.chainId]
  const colors = useNetworkColors(currency.chainId)
  return (
    <Pressable onPress={onPress}>
      <Box
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        width="100%"
        my="xs"
        px="lg">
        <Box flexDirection="row">
          <Box alignItems="center" justifyContent="center" flexDirection="row">
            <CurrencyLogo currency={currency} size={40} />
            <Text variant="h4" ml="sm">
              {currency.symbol}
            </Text>
          </Box>
          {currency.chainId !== ChainId.MAINNET && (
            <CenterBox borderRadius="md" px="xs" style={{ backgroundColor: colors?.background }}>
              <Text variant="bodySm" style={{ color: colors?.foreground }}>
                {info.label}
              </Text>
            </CenterBox>
          )}
        </Box>
        <Box alignItems="flex-end">
          <Text variant="bodyLg">$</Text>
          <Text variant="body">-</Text>
        </Box>
      </Box>
    </Pressable>
  )
}
