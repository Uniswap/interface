import { LinearGradient } from 'expo-linear-gradient'
import { ComponentProps, default as React, useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo, StyleSheet } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import PlusIcon from 'src/assets/icons/plus.svg'
import { AccountCardItem } from 'src/components/accounts/AccountCardItem'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { PollingInterval } from 'src/constants/misc'
import { isNonPollingRequestInFlight } from 'src/data/utils'
import { useAccountListQuery } from 'src/data/__generated__/types-and-hooks'
import { FEATURE_FLAGS } from 'src/features/experiments/constants'
import { useFeatureFlag } from 'src/features/experiments/hooks'
import { ElementName } from 'src/features/telemetry/constants'
import { Account, AccountType } from 'src/features/wallet/accounts/types'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { spacing } from 'src/styles/sizing'

type AccountListProps = Pick<ComponentProps<typeof AccountCardItem>, 'onPress' | 'onPressEdit'> & {
  accounts: Account[]
  isVisible?: boolean
  onAddWallet: () => void
}

type AccountWithPortfolioValue = {
  account: Account
  isPortfolioValueLoading: boolean
  portfolioValue: number | undefined
}

const STICKY_HEADER_INDICES = [0]

export function AccountList({
  accounts,
  onAddWallet,
  onPressEdit,
  onPress,
  isVisible,
}: AccountListProps): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const activeAccount = useActiveAccount()
  const addresses = accounts.map((a) => a.address)

  const isAccountSwitcherModalEnabled = useFeatureFlag(FEATURE_FLAGS.AccountSwitcherModal, false)

  const { data, networkStatus, refetch, startPolling, stopPolling } = useAccountListQuery({
    variables: { addresses },
    notifyOnNetworkStatusChange: true,
  })

  // Only poll account total value when the AccountDrawer is open
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

  const ListHeader = useMemo(
    () => (
      <Flex row alignItems="center" bg="background0" borderBottomColor="backgroundOutline" pb="sm">
        <Box flex={1}>
          <Text
            color="textPrimary"
            px="lg"
            textAlign={isAccountSwitcherModalEnabled ? 'center' : undefined}
            variant="bodyLarge">
            {t('Your wallets')}
          </Text>
        </Box>
        {isAccountSwitcherModalEnabled ? null : (
          <TouchableArea
            borderColor="backgroundOutline"
            borderRadius="full"
            borderWidth={1}
            mr="md"
            name={ElementName.ImportAccount}
            p="xs"
            onPress={onAddWallet}>
            <PlusIcon
              color={theme.colors.textSecondary}
              height={theme.iconSizes.xs}
              width={theme.iconSizes.xs}
            />
          </TouchableArea>
        )}
      </Flex>
    ),
    [isAccountSwitcherModalEnabled, t, onAddWallet, theme]
  )

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<AccountWithPortfolioValue>) => {
      return (
        <AccountCardItem
          address={item.account.address}
          isActive={!!activeAccount && activeAccount.address === item.account.address}
          isPortfolioValueLoading={item.isPortfolioValueLoading}
          isViewOnly={item.account.type === AccountType.Readonly}
          portfolioValue={item.portfolioValue}
          onPress={onPress}
          onPressEdit={onPressEdit}
        />
      )
    },
    [activeAccount, onPress, onPressEdit]
  )

  return (
    <Box flexShrink={1} position="relative">
      <FlatList
        ListFooterComponent={<Box height={theme.spacing.lg} />}
        ListHeaderComponent={ListHeader}
        bounces={false}
        data={accountsWithPortfolioValue}
        keyExtractor={key}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={STICKY_HEADER_INDICES}
      />
      <LinearGradient
        colors={[theme.colors.translucentBackgroundBackdrop, theme.colors.background0]}
        end={{ x: 0, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={ListSheet.gradient}
      />
    </Box>
  )
}

const key = (a: AccountWithPortfolioValue): string => a.account.address

const ListSheet = StyleSheet.create({
  gradient: {
    bottom: 0,
    height: spacing.lg,
    left: 0,
    position: 'absolute',
    width: '100%',
  },
})
