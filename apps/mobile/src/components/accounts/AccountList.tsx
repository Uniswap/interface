import { LinearGradient } from 'expo-linear-gradient'
import { ComponentProps, default as React, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { AccountCardItem } from 'src/components/accounts/AccountCardItem'
import { VirtualizedList } from 'src/components/layout/VirtualizedList'
import { Flex, Text, useSporeColors } from 'ui/src'
import { opacify, spacing } from 'ui/src/theme'
import { useAsyncData } from 'utilities/src/react/hooks'
import { PollingInterval } from 'wallet/src/constants/misc'
import { isNonPollingRequestInFlight } from 'wallet/src/data/utils'
import { useAccountList } from 'wallet/src/features/accounts/hooks'
import { Account, AccountType } from 'wallet/src/features/wallet/accounts/types'

// Most screens can fit more but this is set conservatively
const MIN_ACCOUNTS_TO_ENABLE_SCROLL = 5

type AccountListProps = Pick<ComponentProps<typeof AccountCardItem>, 'onPress'> & {
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
    <Flex fill px="$spacing24" py="$spacing8">
      <Text color="$neutral2" variant="subheading2">
        {t('account.wallet.header.viewOnly')}
      </Text>
    </Flex>
  )
}

const SignerHeader = (): JSX.Element => {
  const { t } = useTranslation()
  return (
    <Flex fill px="$spacing24" py="$spacing8">
      <Text color="$neutral2" variant="subheading2">
        {t('account.wallet.header.other')}
      </Text>
    </Flex>
  )
}

export function AccountList({ accounts, onPress, isVisible }: AccountListProps): JSX.Element {
  const colors = useSporeColors()
  const addresses = useMemo(() => accounts.map((a) => a.address), [accounts])

  const { data, networkStatus, refetch, startPolling, stopPolling } = useAccountList({
    addresses,
    notifyOnNetworkStatusChange: true,
  })

  // Only poll account total values when the account list is visible
  const controlPolling = useCallback(async () => {
    if (isVisible) {
      await refetch()
      startPolling(PollingInterval.Fast)
    } else {
      stopPolling()
    }
  }, [isVisible, refetch, startPolling, stopPolling])

  useAsyncData(controlPolling)

  const isPortfolioValueLoading = isNonPollingRequestInFlight(networkStatus)

  const accountsWithPortfolioValue: AccountWithPortfolioValue[] = useMemo(() => {
    return accounts.map((account, i) => {
      return {
        account,
        isPortfolioValueLoading,
        portfolioValue: data?.portfolios?.[i]?.tokensTotalDenominatedValue?.value,
      }
    })
  }, [accounts, data, isPortfolioValueLoading])

  const signerAccounts = useMemo(() => {
    return accountsWithPortfolioValue.filter(
      (account) => account.account.type === AccountType.SignerMnemonic
    )
  }, [accountsWithPortfolioValue])

  const hasSignerAccounts = signerAccounts.length > 0

  const viewOnlyAccounts = useMemo(() => {
    return accountsWithPortfolioValue.filter(
      (account) => account.account.type === AccountType.Readonly
    )
  }, [accountsWithPortfolioValue])

  const hasViewOnlyAccounts = viewOnlyAccounts.length > 0

  const renderAccountCardItem = useCallback(
    (item: AccountWithPortfolioValue): JSX.Element => (
      <AccountCardItem
        key={item.account.address}
        address={item.account.address}
        isPortfolioValueLoading={item.isPortfolioValueLoading}
        isViewOnly={item.account.type === AccountType.Readonly}
        portfolioValue={item.portfolioValue}
        onPress={onPress}
      />
    ),
    [onPress]
  )

  return (
    <Flex shrink>
      {/* TODO(MOB-646): attempt to switch gradients to react-native-svg#LinearGradient and avoid new clear color */}
      <LinearGradient
        colors={[opacify(0, colors.surface1.val), colors.surface1.val]}
        end={{ x: 0, y: 0 }}
        start={{ x: 0, y: 1 }}
        style={ListSheet.topGradient}
      />
      <VirtualizedList
        bounces={false}
        scrollEnabled={accountsWithPortfolioValue.length >= MIN_ACCOUNTS_TO_ENABLE_SCROLL}
        showsVerticalScrollIndicator={false}>
        {hasSignerAccounts && (
          <>
            <SignerHeader />
            {signerAccounts.map(renderAccountCardItem)}
          </>
        )}
        {hasViewOnlyAccounts && (
          <>
            <ViewOnlyHeader />
            {viewOnlyAccounts.map(renderAccountCardItem)}
          </>
        )}
      </VirtualizedList>
      <LinearGradient
        colors={[opacify(0, colors.surface1.val), colors.surface1.val]}
        end={{ x: 0, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={ListSheet.bottomGradient}
      />
    </Flex>
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
