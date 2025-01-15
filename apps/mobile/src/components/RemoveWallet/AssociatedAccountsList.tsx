import React, { useMemo } from 'react'
import { StyleSheet } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { Flex, Text } from 'ui/src'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { spacing } from 'ui/src/theme'
import { AccountListQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { AddressDisplay } from 'wallet/src/components/accounts/AddressDisplay'
import { useAccountList } from 'wallet/src/features/accounts/hooks'
import { Account } from 'wallet/src/features/wallet/accounts/types'

const ADDRESS_ROW_HEIGHT = 40

interface SortedAddressData {
  address: string
  balance: number
}

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
      balance: portfolio.tokensTotalDenominatedValue?.value ?? 0,
    }))
    .sort((a, b) => b.balance - a.balance)

  const accountsScrollViewHeight =
    Math.floor((fullHeight * 0.3) / ADDRESS_ROW_HEIGHT) * ADDRESS_ROW_HEIGHT +
    ADDRESS_ROW_HEIGHT / 2 +
    spacing.spacing12 // 12 is the ScrollView vertical padding

  const renderItem = ({ item, index }: { item: SortedAddressData; index: number }): JSX.Element => {
    return (
      <AssociatedAccountRow
        address={item.address}
        balance={item.balance}
        index={index}
        loading={loading}
        totalCount={accounts.length}
      />
    )
  }

  return (
    <Flex
      borderColor="$surface3"
      borderRadius="$rounded16"
      borderWidth={1}
      maxHeight={accountsScrollViewHeight}
      px="$spacing12"
      width="100%"
    >
      <FlatList
        data={sortedAddressesByBalance}
        keyExtractor={(item) => item.address}
        renderItem={renderItem}
        bounces={false}
        contentContainerStyle={[styles.accounts, { paddingBottom: spacing.spacing12 }]}
        keyboardShouldPersistTaps="handled"
      />
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
      pb={index !== totalCount - 1 ? '$spacing16' : undefined}
    >
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
