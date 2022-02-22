import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import React from 'react'
import { Pressable } from 'react-native'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Box } from 'src/components/layout/Box'
import { CenterBox } from 'src/components/layout/CenterBox'
import { InlinePriceChart } from 'src/components/PriceChart/InlinePriceChart'
import { Text } from 'src/components/Text'
import { ChainId, CHAIN_INFO } from 'src/constants/chains'
import { useNetworkColors } from 'src/utils/colors'
import { formatCurrencyAmount, formatUSDPrice } from 'src/utils/format'
import { Flex } from '../layout'

interface OptionProps {
  currency: Currency
  currencyAmount?: CurrencyAmount<Currency>
  currencyPrice?: number
  onPress: () => void
  metadataType: 'balance' | 'price'
}

export function Option({
  currency,
  currencyAmount,
  currencyPrice,
  onPress,
  metadataType,
}: OptionProps) {
  const info = CHAIN_INFO[currency.chainId]
  const colors = useNetworkColors(currency.chainId)

  const balance =
    currencyPrice !== undefined && currencyAmount
      ? currencyPrice * parseFloat(currencyAmount?.toSignificant())
      : undefined

  return (
    <Pressable testID={`currency-option-${currency.symbol}`} onPress={onPress}>
      <Flex row alignItems="center" justifyContent="space-between" py="sm">
        <Flex centered row gap="xs">
          <Flex centered row gap="sm">
            <CurrencyLogo currency={currency} size={36} />
            <Text variant="h4">{currency.symbol}</Text>
          </Flex>
          {currency.chainId !== ChainId.Mainnet && (
            <CenterBox borderRadius="sm" p="xs" style={{ backgroundColor: colors?.background }}>
              <Text style={{ color: colors?.foreground }} variant="bodySm">
                {info.label}
              </Text>
            </CenterBox>
          )}
        </Flex>
        {metadataType === 'price' ? (
          <TokenMetadata
            main={formatUSDPrice(currencyPrice)}
            pre={<InlinePriceChart currency={currency} />}
          />
        ) : currencyAmount && !currencyAmount.equalTo(0) ? (
          <TokenMetadata
            main={formatCurrencyAmount(currencyAmount)}
            sub={formatUSDPrice(balance)}
          />
        ) : null}
      </Flex>
    </Pressable>
  )
}

interface TokenMetadataProps {
  pre?: React.ReactNode
  main: React.ReactNode
  sub?: React.ReactNode
}

/** Helper component to format rhs metadata for a given token. */
function TokenMetadata({ pre, main, sub }: TokenMetadataProps) {
  return (
    <Flex row>
      {pre}
      <Box alignItems="flex-end" minWidth={70}>
        <Text variant="bodyBold">{main}</Text>
        {sub && (
          <Text color="gray400" variant="bodySm">
            {sub}
          </Text>
        )}
      </Box>
    </Flex>
  )
}
