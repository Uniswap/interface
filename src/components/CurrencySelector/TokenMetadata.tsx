import { Currency } from '@uniswap/sdk-core'
import React, { useMemo } from 'react'
import { ActivityIndicator } from 'react-native'
import { Box } from 'src/components/layout/Box'
import { InlinePriceChart } from 'src/components/PriceChart/InlinePriceChart'
import { Text } from 'src/components/Text'
import { RelativeChange } from 'src/components/text/RelativeChange'
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
  metadataType: 'balance' | 'price'
}

export default function TokenMetadata({ currency, metadataType }: OptionProps) {
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
    <Flex row justifyContent="flex-end">
      {loading ? (
        <ActivityIndicator size={20} />
      ) : metadataType === 'price' ? (
        <DataFormatter
          main={formatUSDPrice(currencyPrice?.price)}
          pre={<InlinePriceChart currency={currency} />}
          sub={<RelativeChange change={currencyPrice?.relativeChange24} />}
        />
      ) : balance?.amount && !balance.amount.equalTo(0) ? (
        <DataFormatter
          main={formatCurrencyAmount(balance.amount)}
          sub={formatUSDPrice(balance.balanceUSD)}
        />
      ) : null}
    </Flex>
  )
}

interface DataFormatterProps {
  pre?: React.ReactNode
  main: React.ReactNode
  sub?: React.ReactNode
}

/** Helper component to format rhs metadata for a given token. */
function DataFormatter({ pre, main, sub }: DataFormatterProps) {
  return (
    <Flex row>
      {pre}
      <Box alignItems="flex-end" minWidth={70}>
        <Text variant="body">{main}</Text>
        {sub && (
          <Text color="textSecondary" variant="bodySmall">
            {sub}
          </Text>
        )}
      </Box>
    </Flex>
  )
}
