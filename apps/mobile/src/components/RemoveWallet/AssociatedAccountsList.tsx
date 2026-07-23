import React, { useMemo } from 'react'
import { StyleSheet } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { Flex, Text } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { AddressDisplay } from 'uniswap/src/components/accounts/AddressDisplay'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { useAccountListData } from 'wallet/src/features/accounts/useAccountListData'
import { Account } from 'wallet/src/features/wallet/accounts/types'

interface SortedAddressData {
  address: string
  balance: number
}

function AssociatedAccountsListInner({ accounts }: { accounts: Account[] }): JSX.Element {
  const addresses = useMemo(() => accounts.map((account) => account.address), [accounts])
  const { balancesByAddress, loading } = useAccountListData({
    addresses,
  })

  const sortedAddressesByBalance = addresses
    .map((address) => ({
      address,
      balance: balancesByAddress?.[address] ?? 0,
    }))
    .sort((a, b) => b.balance - a.balance)

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
      borderWidth="$spacing1"
      flexShrink={1}
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

export const AssociatedAccountsList = React.memo(AssociatedAccountsListInner)

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
