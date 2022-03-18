import { Currency } from '@uniswap/sdk-core'
import Fuse from 'fuse.js'
import React from 'react'
import { Pressable } from 'react-native'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Box } from 'src/components/layout/Box'
import { InlinePriceChart } from 'src/components/PriceChart/InlinePriceChart'
import { Text } from 'src/components/Text'
import { PortfolioBalance } from 'src/features/dataApi/types'
import { Theme } from 'src/styles/theme'
import { formatCurrencyAmount, formatUSDPrice } from 'src/utils/format'
import { Flex } from '../layout'

interface OptionProps {
  balance?: PortfolioBalance
  currency: Currency
  currencyPrice?: number
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
    <Pressable testID={`currency-option-${currency.symbol}`} onPress={onPress}>
      <Flex row alignItems="center" justifyContent="space-between" py="sm">
        <Flex centered row gap="xs">
          <Flex centered row gap="sm">
            <CurrencyLogo currency={currency} size={40} />
            <Flex alignItems="flex-start" gap="xs">
              <Flex centered row>
                {nameMatches?.length ? (
                  <TextWithMatches matches={nameMatches} text={currency.name ?? ''} variant="h4" />
                ) : (
                  <Text variant="h4">{currency.name}</Text>
                )}
              </Flex>

              {symbolMatches?.length ? (
                <TextWithMatches
                  matches={symbolMatches}
                  text={currency.symbol ?? ''}
                  variant="bodySmSoft"
                />
              ) : (
                <Text variant="bodySmSoft">{currency.symbol}</Text>
              )}
            </Flex>
          </Flex>
        </Flex>
        {metadataType === 'price' ? (
          <TokenMetadata
            main={formatUSDPrice(currencyPrice)}
            pre={<InlinePriceChart currency={currency} />}
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

interface TextWithMatchesProps {
  text: string
  matches: readonly Fuse.FuseResultMatch[]
  variant: keyof Theme['textVariants']
}

function TextWithMatches({ matches, text, variant }: TextWithMatchesProps) {
  const charIsMatch = new Set()
  for (const match of matches) {
    for (const index of match.indices) {
      for (let i = index[0]; i < index[1] + 1; i++) {
        charIsMatch.add(i)
      }
    }
  }

  const pieces = []
  for (let i = 0; i < text.length; i++) {
    if (charIsMatch.has(i)) {
      pieces.push([text[i], true])
    } else {
      pieces.push([text[i], false])
    }
  }

  const elements = (
    <>
      {pieces.map((p, i) => {
        if (p[1])
          return (
            <Text key={`${i}${p[0]}`} color="textColor" variant={variant}>
              {p[0]}
            </Text>
          )
        else
          return (
            <Text key={`${i}${p[0]}`} color="gray400" variant={variant}>
              {p[0]}
            </Text>
          )
      })}
    </>
  )

  return <Flex row>{elements}</Flex>
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
