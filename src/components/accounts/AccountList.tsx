import { LinearGradient } from 'expo-linear-gradient'
import { ComponentProps, default as React, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { useAppTheme } from 'src/app/hooks'
import { AccountCardItem } from 'src/components/accounts/AccountCardItem'
import { Box, Flex } from 'src/components/layout'
import { Spacer } from 'src/components/layout/Spacer'
import { Text } from 'src/components/Text'
import { PollingInterval } from 'src/constants/misc'
import { isNonPollingRequestInFlight } from 'src/data/utils'
import { useAccountListQuery } from 'src/data/__generated__/types-and-hooks'
import { Account, AccountType } from 'src/features/wallet/accounts/types'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { spacing } from 'src/styles/sizing'

// Most screens can fit more but this is set conservatively
const MIN_ACCOUNTS_TO_ENABLE_SCROLL = 5

type AccountListProps = Pick<ComponentProps<typeof AccountCardItem>, 'onPress' | 'onPressEdit'> & {
  accounts: Account[]
  isVisible?: boolean
}

type AccountWithPortfolioValue = {
  account: Account
  isPortfolioValueLoading: boolean
  portfolioValue: number | undefined
}

const ViewOnlyHeader = (): JSX.Element => {
  const { t } = useTranslation()
  return (
    <Flex row alignItems="center" borderBottomColor="backgroundOutline">
      <Box flex={1} px="spacing24">
        <Text color="textSecondary" variant="subheadSmall">
          {t('View only')}
        </Text>
      </Box>
    </Flex>
  )
}

export function AccountList({
  accounts,
  onPressEdit,
  onPress,
  isVisible,
}: AccountListProps): JSX.Element {
  const theme = useAppTheme()
  const activeAccount = useActiveAccount()
  const addresses = accounts.map((a) => a.address)

  const { data, networkStatus, refetch, startPolling, stopPolling } = useAccountListQuery({
    variables: { addresses },
    notifyOnNetworkStatusChange: true,
  })

  // Only poll account total values when the account list is visible
  useEffect(() => {
    if (isVisible) {
      refetch()
      startPolling(PollingInterval.Fast)
    } else {
      stopPolling()
    }
  }, [isVisible, refetch, startPolling, stopPolling])

  const isPortfolioValueLoading = isNonPollingRequestInFlight(networkStatus)

  const accountsWithPortfolioValue = useMemo(() => {
    return accounts.map((account, i) => {
      return {
        account,
        isPortfolioValueLoading,
        portfolioValue: data?.portfolios?.[i]?.tokensTotalDenominatedValue?.value,
      } as AccountWithPortfolioValue
    })
  }, [accounts, data, isPortfolioValueLoading])

  const signerAccounts = useMemo(() => {
    return accountsWithPortfolioValue.filter(
      (account) => account.account.type === AccountType.SignerMnemonic
    )
  }, [accountsWithPortfolioValue])

  const viewOnlyAccounts = useMemo(() => {
    return accountsWithPortfolioValue.filter(
      (account) => account.account.type === AccountType.Readonly
    )
  }, [accountsWithPortfolioValue])

  const hasViewOnlyAccounts = viewOnlyAccounts.length > 0

  const renderAccountCardItem = (item: AccountWithPortfolioValue): JSX.Element => (
    <AccountCardItem
      key={item.account.address}
      address={item.account.address}
      isActive={!!activeAccount && activeAccount.address === item.account.address}
      isPortfolioValueLoading={item.isPortfolioValueLoading}
      isViewOnly={item.account.type === AccountType.Readonly}
      portfolioValue={item.portfolioValue}
      onPress={onPress}
      onPressEdit={onPressEdit}
    />
  )

  return (
    <Box flexShrink={1} position="relative">
      {/* TODO: [MOB-3938] attempt to switch gradients to react-native-svg#LinearGradient and avoid new clear color */}
      <LinearGradient
        colors={[theme.colors.clearBackground1Backdrop, theme.colors.background1]}
        end={{ x: 0, y: 0 }}
        start={{ x: 0, y: 1 }}
        style={ListSheet.topGradient}
      />
      <ScrollView
        bounces={false}
        scrollEnabled={accountsWithPortfolioValue.length >= MIN_ACCOUNTS_TO_ENABLE_SCROLL}
        showsVerticalScrollIndicator={false}>
        {signerAccounts.map(renderAccountCardItem)}
        {hasViewOnlyAccounts && (
          <>
            <Spacer height={theme.spacing.spacing8} />
            <ViewOnlyHeader />
            {viewOnlyAccounts.map(renderAccountCardItem)}
          </>
        )}
      </ScrollView>
      <LinearGradient
        colors={[theme.colors.clearBackground1Backdrop, theme.colors.background1]}
        end={{ x: 0, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={ListSheet.bottomGradient}
      />
    </Box>
  )
}

const ListSheet = StyleSheet.create({
  bottomGradient: {
    bottom: 0,
    height: spacing.spacing16,
    left: 0,
    position: 'absolute',
    width: '100%',
  },
  topGradient: {
    height: spacing.spacing16,
    left: 0,
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 1,
  },
})
