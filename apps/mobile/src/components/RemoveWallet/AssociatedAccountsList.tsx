import React, { useMemo } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { Flex, Text, useDeviceDimensions } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { AccountListQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { NumberType } from 'utilities/src/format/types'
import { AddressDisplay } from 'wallet/src/components/accounts/AddressDisplay'
import { useAccountList } from 'wallet/src/features/accounts/hooks'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { Account } from 'wallet/src/features/wallet/accounts/types'

const ADDRESS_ROW_HEIGHT = 40

type Portfolio = NonNullable<NonNullable<NonNullable<AccountListQuery['portfolios']>[0]>>

function _AssociatedAccountsList({ accounts }: { accounts: Account[] }): JSX.Element {
  const { fullHeight } = useDeviceDimensions()
  const addresses = useMemo(() => accounts.map((account) => account.address), [accounts])
  const { data, loading } = useAccountList({
    addresses,
    notifyOnNetworkStatusChange: true,
  })

  const sortedAddressesByBalance = (data?.portfolios ?? [])
    .filter((portfolio): portfolio is Portfolio => Boolean(portfolio))
    .map((portfolio) => ({
      address: portfolio.ownerAddress,
      balance: portfolio.tokensTotalDenominatedValue?.value,
    }))
    .sort((a, b) => (b.balance ?? 0) - (a.balance ?? 0))

  // set max height to around 30% screen size, so we always cut the last visible element
  // this way user is aware if there are more elements to see
  const accountsScrollViewHeight =
    Math.floor((fullHeight * 0.3) / ADDRESS_ROW_HEIGHT) * ADDRESS_ROW_HEIGHT +
    ADDRESS_ROW_HEIGHT / 2 +
    spacing.spacing12 // 12 is the ScrollView vertical padding

  return (
    <Flex
      borderColor="$surface3"
      borderRadius="$rounded16"
      borderWidth={1}
      maxHeight={accountsScrollViewHeight}
      px="$spacing12"
      width="100%">
      <ScrollView bounces={false} contentContainerStyle={styles.accounts}>
        {sortedAddressesByBalance.map(({ address, balance }, index) => (
          <AssociatedAccountRow
            address={address}
            balance={balance}
            index={index}
            loading={loading}
            totalCount={accounts.length}
          />
        ))}
      </ScrollView>
    </Flex>
  )
}

export const AssociatedAccountsList = React.memo(_AssociatedAccountsList)

function AssociatedAccountRow({
  index,
  address,
  balance,
  totalCount,
  loading,
}: {
  index: number
  address: string
  balance: number | undefined
  totalCount: number
  loading: boolean
}): JSX.Element {
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const balanceFormatted = convertFiatAmountFormatted(balance, NumberType.PortfolioBalance)

  return (
    <Flex
      key={address}
      row
      alignItems="center"
      justifyContent="space-between"
      pb={index !== totalCount - 1 ? '$spacing16' : undefined}>
      <Flex shrink>
        <AddressDisplay hideAddressInSubtitle address={address} size={24} variant="subheading2" />
      </Flex>
      <Text color="$neutral2" loading={loading} numberOfLines={1} variant="body3">
        {balanceFormatted}
      </Text>
    </Flex>
  )
}

const styles = StyleSheet.create({
  accounts: {
    paddingVertical: spacing.spacing12,
  },
})
