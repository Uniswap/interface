import { Currency } from '@uniswap/sdk-core'
import React, { useMemo } from 'react'
import { ActivityIndicator } from 'react-native'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { useActiveChainIds } from 'src/features/chains/utils'
import { useAllBalancesByChainId } from 'src/features/dataApi/balances'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { currencyId } from 'src/utils/currencyId'
import { formatCurrencyAmount, formatUSDPrice } from 'src/utils/format'
import { Flex } from '../layout'

interface OptionProps {
  currency: Currency
}

export default function TokenMetadata({ currency }: OptionProps) {
  const { balances, loading: balanceLoading } = useAllBalancesByChainId(
    useActiveAccount()?.address,
    useActiveChainIds()
  )

  const balance = useMemo(
    () => balances[currency.chainId as ChainId]?.[currencyId(currency)],
    [balances, currency]
  )

  return (
    <Flex row justifyContent="flex-end">
      {balanceLoading ? (
        <ActivityIndicator size={20} />
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
