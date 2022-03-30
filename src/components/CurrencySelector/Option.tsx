import { Currency } from '@uniswap/sdk-core'
import Fuse from 'fuse.js'
import React from 'react'
import { Pressable } from 'react-native'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Box } from 'src/components/layout/Box'
import { InlinePriceChart } from 'src/components/PriceChart/InlinePriceChart'
import { Text } from 'src/components/Text'
import { RelativeChange } from 'src/components/text/RelativeChange'
import { TextWithFuseMatches } from 'src/components/text/TextWithFuseMatches'
import { PortfolioBalance, SpotPrice } from 'src/features/dataApi/types'
import { formatCurrencyAmount, formatUSDPrice } from 'src/utils/format'
import { Flex } from '../layout'

interface OptionProps {
  balance?: PortfolioBalance
  currency: Currency
  currencyPrice?: SpotPrice
  onPress: () => void
  metadataType: 'balance' | 'price'
  matches: Fuse.FuseResult<Currency>['matches']
}

export function Option({
  balance,
  currency,
  currencyPrice,
  onPress,
  matches,
  metadataType,
}: OptionProps) {
  const symbolMatches = matches?.filter((m) => m.key === 'symbol')
  const nameMatches = matches?.filter((m) => m.key === 'name')

  return (
    <Pressable testID={`currency-option-${currency.chainId}-${currency.symbol}`} onPress={onPress}>
      <Flex row alignItems="center" justifyContent="space-between" py="sm">
        <Flex centered row gap="xs">
          <Flex centered row gap="sm">
            <CurrencyLogo currency={currency} size={40} />
            <Flex alignItems="flex-start" gap="xs">
              <Flex centered row>
                <TextWithFuseMatches
                  matches={nameMatches}
                  text={currency.name ?? ''}
                  variant="h4"
                />
              </Flex>

              <TextWithFuseMatches
                matches={symbolMatches}
                text={currency.symbol ?? ''}
                variant="bodySmSoft"
              />
            </Flex>
          </Flex>
        </Flex>
        {metadataType === 'price' ? (
          <TokenMetadata
            main={formatUSDPrice(currencyPrice?.price)}
            pre={<InlinePriceChart currency={currency} />}
            sub={<RelativeChange change={currencyPrice?.relativeChange24} />}
          />
        ) : balance?.amount && !balance.amount.equalTo(0) ? (
          <TokenMetadata
            main={formatCurrencyAmount(balance.amount)}
            sub={formatUSDPrice(balance.balanceUSD)}
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
