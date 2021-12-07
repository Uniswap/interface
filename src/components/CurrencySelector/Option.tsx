import { Currency } from '@uniswap/sdk-core'
import React from 'react'
import { Pressable } from 'react-native'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Box } from 'src/components/layout/Box'
import { CenterBox } from 'src/components/layout/CenterBox'
import { Text } from 'src/components/Text'
import { ChainId, CHAIN_INFO } from 'src/constants/chains'
import { getNetworkColors } from 'src/utils/colors'

interface OptionProps {
  currency: Currency
  onPress: () => void
}

export function Option({ currency, onPress }: OptionProps) {
  const info = CHAIN_INFO[currency.chainId]
  const colors = getNetworkColors(currency.chainId)
  return (
    <Pressable onPress={onPress}>
      <Box flexDirection="row" justifyContent="space-between" alignItems="center" width="100%">
        <Box flexDirection="row" alignItems="center">
          <CurrencyLogo currency={currency} size={20} />

          <Box marginHorizontal="md" alignItems="flex-start" flexDirection="row">
            <Text variant="body">{currency.symbol}</Text>
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
          <Text variant="body">~$</Text>
          <Text variant="bodySm">-</Text>
        </Box>
      </Box>
    </Pressable>
  )
}
