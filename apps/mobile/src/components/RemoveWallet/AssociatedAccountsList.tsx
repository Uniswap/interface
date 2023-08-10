import React from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { dimensions } from 'ui/src/theme/restyle/sizing'
import { spacing } from 'ui/src/theme/spacing'
import { formatUSDPrice } from 'utilities/src/format/format'
import {
  AccountListQuery,
  useAccountListQuery,
} from 'wallet/src/data/__generated__/types-and-hooks'
import { Account } from 'wallet/src/features/wallet/accounts/types'

const ADDRESS_ROW_HEIGHT = 40

type Portfolio = NonNullable<NonNullable<NonNullable<AccountListQuery['portfolios']>[0]>>

function _AssociatedAccountsList({ accounts }: { accounts: Account[] }): JSX.Element {
  const { data, loading } = useAccountListQuery({
    variables: {
      addresses: accounts.map((account) => account.address),
    },
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
    Math.floor((dimensions.fullHeight * 0.3) / ADDRESS_ROW_HEIGHT) * ADDRESS_ROW_HEIGHT +
    ADDRESS_ROW_HEIGHT / 2 +
    spacing.spacing12 // 12 is the ScrollView vertical padding

  return (
    <Box
      borderColor="surface3"
      borderRadius="rounded16"
      borderWidth={1}
      maxHeight={accountsScrollViewHeight}
      mb="spacing16"
      px="spacing12"
      width="100%">
      <ScrollView bounces={false} contentContainerStyle={styles.accounts}>
        {sortedAddressesByBalance.map(({ address, balance }, index) => (
          <Flex
            key={address}
            row
            alignItems="center"
            justifyContent="space-between"
            pb={index !== accounts.length - 1 ? 'spacing16' : undefined}>
            <AddressDisplay
              hideAddressInSubtitle
              address={address}
              size={24}
              variant="subheadSmall"
            />
            <Text color="neutral3" loading={loading} numberOfLines={1} variant="buttonLabelMicro">
              {formatUSDPrice(balance)}
            </Text>
          </Flex>
        ))}
      </ScrollView>
    </Box>
  )
}

export const AssociatedAccountsList = React.memo(_AssociatedAccountsList)

const styles = StyleSheet.create({
  accounts: {
    paddingVertical: spacing.spacing12,
  },
})
