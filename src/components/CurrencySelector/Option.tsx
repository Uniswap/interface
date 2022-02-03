import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import React from 'react'
import { Pressable } from 'react-native'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Box } from 'src/components/layout/Box'
import { CenterBox } from 'src/components/layout/CenterBox'
import { Text } from 'src/components/Text'
import { ChainId, CHAIN_INFO } from 'src/constants/chains'
import { useNetworkColors } from 'src/utils/colors'
import { formatCurrencyAmount, formatUSDPrice } from 'src/utils/format'

interface OptionProps {
  currency: Currency
  onPress: () => void
  selected: boolean
  currencyAmount: CurrencyAmount<Currency> | undefined
  currencyPrice: number | undefined
}

export function Option({ currency, onPress, currencyAmount, currencyPrice }: OptionProps) {
  const info = CHAIN_INFO[currency.chainId]
  const colors = useNetworkColors(currency.chainId)
  const balance =
    currencyPrice !== undefined && currencyAmount
      ? currencyPrice * parseFloat(currencyAmount?.toSignificant())
      : undefined
  return (
    <Pressable onPress={onPress}>
      <Box
        alignItems="center"
        flexDirection="row"
        justifyContent="space-between"
        my="sm"
        px="lg"
        width="100%">
        <Box alignItems="center" flexDirection="row">
          <Box alignItems="center" flexDirection="row" justifyContent="center">
            <CurrencyLogo currency={currency} size={36} />
            <Text ml="sm" variant="h4">
              {currency.symbol}
            </Text>
          </Box>
          {currency.chainId !== ChainId.Mainnet && (
            <CenterBox
              borderRadius="sm"
              ml="sm"
              p="xs"
              style={{ backgroundColor: colors?.background }}>
              <Text style={{ color: colors?.foreground }} variant="bodySm">
                {info.label}
              </Text>
            </CenterBox>
          )}
        </Box>
        {currencyAmount && !currencyAmount.equalTo(0) ? (
          <Box alignItems="flex-end">
            <Text variant="bodyBold">{formatCurrencyAmount(currencyAmount)}</Text>
            <Text color="gray400" variant="bodySm">
              {formatUSDPrice(balance)}
            </Text>
          </Box>
        ) : null}
      </Box>
    </Pressable>
  )
}
