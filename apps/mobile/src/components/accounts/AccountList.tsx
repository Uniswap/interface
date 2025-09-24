import { useMutation } from '@tanstack/react-query'
import { isNonPollingRequestInFlight } from '@universe/api'
import { LinearGradient } from 'expo-linear-gradient'
import { ComponentProps, default as React, useCallback, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { AccountCardItem } from 'src/components/accounts/AccountCardItem'
import { Flex, Text, useSporeColors } from 'ui/src'
import { opacify, spacing } from 'ui/src/theme'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { useAccountListData } from 'wallet/src/features/accounts/useAccountListData'
import { Account } from 'wallet/src/features/wallet/accounts/types'

type AccountListProps = Pick<ComponentProps<typeof AccountCardItem>, 'onPress'> & {
  accounts: Account[]
  isVisible?: boolean
  onClose: () => void
}

type AccountWithPortfolioValue = {
  account: Account
  isPortfolioValueLoading: boolean
  portfolioValue: number | undefined
}

const ViewOnlyHeaderContent = (): JSX.Element => {
  const { t } = useTranslation()
  return (
    <Flex fill px="$spacing24" py="$spacing8">
      <Text color="$neutral2" variant="subheading2">
        {t('account.wallet.header.viewOnly')}
      </Text>
    </Flex>
  )
}

enum AccountListItemType {
  SignerAccount = 0,
  ViewOnlyHeader = 1,
  ViewOnlyAccount = 2,
}

type AccountListItem =
  | { type: AccountListItemType.SignerAccount; account: AccountWithPortfolioValue }
  | { type: AccountListItemType.ViewOnlyHeader }
  | { type: AccountListItemType.ViewOnlyAccount; account: AccountWithPortfolioValue }

export function AccountList({ accounts, onPress, isVisible, onClose }: AccountListProps): JSX.Element {
  const colors = useSporeColors()
  const addresses = useMemo(() => accounts.map((a) => a.address), [accounts])
  const hasPollingRun = useRef(false)

  const { data, networkStatus, refetch, startPolling, stopPolling } = useAccountListData({
    addresses,
    notifyOnNetworkStatusChange: true,
  })

  // Only poll account total values when the account list is visible
  const controlPolling = useCallback(async () => {
    if (hasPollingRun.current) {
      return
    }

    if (isVisible) {
      refetch()
      startPolling(PollingInterval.Fast)
    } else {
      stopPolling()
    }
  }, [isVisible, refetch, startPolling, stopPolling])

  const controlPollingMutation = useMutation({
    mutationFn: controlPolling,
    onSettled: () => {
      hasPollingRun.current = true
    },
    onError: (error) => {
      logger.error(error, {
        tags: { file: 'AccountList', function: 'controlPolling' },
      })
    },
  })

  const controlPollingEvent = useEvent(controlPollingMutation.mutate)

  useEffect(() => {
    controlPollingEvent()
  }, [controlPollingEvent])

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
    return accountsWithPortfolioValue.filter((account) => account.account.type === AccountType.SignerMnemonic)
  }, [accountsWithPortfolioValue])

  const hasSignerAccounts = signerAccounts.length > 0

  const viewOnlyAccounts = useMemo(() => {
    return accountsWithPortfolioValue.filter((account) => account.account.type === AccountType.Readonly)
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
        onClose={onClose}
      />
    ),
    [onPress, onClose],
  )

  const accountsToRender = useMemo(() => {
    const items: AccountListItem[] = []

    if (hasSignerAccounts) {
      items.push(...signerAccounts.map((account) => ({ type: AccountListItemType.SignerAccount, account })))
    }

    if (hasViewOnlyAccounts) {
      items.push({ type: AccountListItemType.ViewOnlyHeader })
      items.push(...viewOnlyAccounts.map((account) => ({ type: AccountListItemType.ViewOnlyAccount, account })))
    }

    return items
  }, [hasSignerAccounts, hasViewOnlyAccounts, signerAccounts, viewOnlyAccounts])

  const renderItem = useCallback(
    // eslint-disable-next-line consistent-return
    ({ item }: { item: AccountListItem }) => {
      switch (item.type) {
        case AccountListItemType.ViewOnlyHeader:
          return <ViewOnlyHeaderContent />
        case AccountListItemType.SignerAccount:
        case AccountListItemType.ViewOnlyAccount:
          return renderAccountCardItem(item.account)
      }
    },
    [renderAccountCardItem],
  )

  const keyExtractor = useCallback(
    (item: AccountListItem, index: number) =>
      item.type === AccountListItemType.SignerAccount || item.type === AccountListItemType.ViewOnlyAccount
        ? item.account.account.address
        : item.type.toString() + index,
    [],
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
      <FlatList data={accountsToRender} keyExtractor={keyExtractor} renderItem={renderItem} />
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
