import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import Fuse from 'fuse.js'
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
  matches: Fuse.FuseResult<Currency>['matches']
}

export function Option({
  currency,
  currencyAmount,
  currencyPrice,
  onPress,
  matches,
  metadataType,
}: OptionProps) {
  const info = CHAIN_INFO[currency.chainId]
  const colors = useNetworkColors(currency.chainId)

  const balance =
    currencyPrice !== undefined && currencyAmount
      ? currencyPrice * parseFloat(currencyAmount?.toSignificant())
      : undefined

  const symbolMatches = matches?.filter((m) => m.key === 'symbol')

  return (
    <Pressable testID={`currency-option-${currency.symbol}`} onPress={onPress}>
      <Flex row alignItems="center" justifyContent="space-between" py="sm">
        <Flex centered row gap="xs">
          <Flex centered row gap="sm">
            <CurrencyLogo currency={currency} size={36} />
            {symbolMatches?.length ? (
              <TextWithMatches matches={symbolMatches} text={currency.symbol ?? ''} />
            ) : (
              <Text variant="h4">{currency.symbol}</Text>
            )}
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

interface TextWithMatchesProps {
  text: string
  matches: readonly Fuse.FuseResultMatch[]
}

function TextWithMatches({ matches, text }: TextWithMatchesProps) {
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
      {pieces.map((p) => {
        if (p[1])
          return (
            <Text color="textColor" variant="h4">
              {p[0]}
            </Text>
          )
        else
          return (
            <Text color="gray400" variant="h4">
              {p[0]}
            </Text>
          )
      })}
    </>
  )

  return elements
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
