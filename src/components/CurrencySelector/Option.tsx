import { Currency } from '@uniswap/sdk-core'
import Fuse from 'fuse.js'
import React, { useMemo } from 'react'
import { ActivityIndicator, Pressable } from 'react-native'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Box } from 'src/components/layout/Box'
import { InlinePriceChart } from 'src/components/PriceChart/InlinePriceChart'
import { Text } from 'src/components/Text'
import { RelativeChange } from 'src/components/text/RelativeChange'
import { TextWithFuseMatches } from 'src/components/text/TextWithFuseMatches'
import { ChainId } from 'src/constants/chains'
import { useActiveChainIds } from 'src/features/chains/utils'
import { useAllBalancesByChainId } from 'src/features/dataApi/balances'
import { useSpotPrices } from 'src/features/dataApi/prices'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { currencyId } from 'src/utils/currencyId'
import { formatCurrencyAmount, formatUSDPrice } from 'src/utils/format'
import { Flex } from '../layout'

interface OptionProps {
  currency: Currency
  onPress: () => void
  metadataType: 'balance' | 'price'
  matches: Fuse.FuseResult<Currency>['matches']
}

export function Option({ currency, onPress, matches, metadataType }: OptionProps) {
  const symbolMatches = matches?.filter((m) => m.key === 'symbol')
  const nameMatches = matches?.filter((m) => m.key === 'name')

  const { balances, loading: balanceLoading } = useAllBalancesByChainId(
    useActiveAccount()?.address,
    useActiveChainIds()
  )

  const balance = useMemo(
    () => balances[currency.chainId as ChainId]?.[currencyId(currency)],
    [balances, currency]
  )
  const { loading: spotPricesLoading, spotPrices } = useSpotPrices(
    balanceLoading || balance ? [] : [currency]
  )

  const currencyPrice = useMemo(
    () =>
      balance
        ? {
            price: balance.balanceUSD,
            relativeChange24: balance.relativeChange24,
          }
        : spotPrices[currencyId(currency.wrapped)],
    [currency.wrapped, balance, spotPrices]
  )

  const loading = balanceLoading || spotPricesLoading

  return (
    <Pressable testID={`currency-option-${currency.chainId}-${currency.symbol}`} onPress={onPress}>
      <Flex row alignItems="center" justifyContent="space-between" py="sm">
        <Flex row flexShrink={1} gap="xs" overflow="hidden">
          <CurrencyLogo currency={currency} size={40} />
          <Flex alignItems="flex-start" flexShrink={1} gap="xxs">
            <Flex row>
              <TextWithFuseMatches matches={nameMatches} text={currency.name ?? ''} variant="h4" />
            </Flex>
            <Flex row>
              <TextWithFuseMatches
                matches={symbolMatches}
                text={currency.symbol ?? ''}
                variant="bodySmSoft"
              />
            </Flex>
          </Flex>
        </Flex>
        <Flex row justifyContent="flex-end">
          {loading ? (
            <ActivityIndicator size={20} />
          ) : metadataType === 'price' ? (
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
