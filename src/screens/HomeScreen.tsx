import { DrawerActions } from '@react-navigation/core'
import { selectionAsync } from 'expo-haptics'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ViewStyle } from 'react-native'
import { Route } from 'react-native-tab-view'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { HomeScreenQueries, useEagerActivityNavigation } from 'src/app/navigation/hooks'
import { useAppStackNavigation } from 'src/app/navigation/types'
import HamburgerIcon from 'src/assets/icons/hamburger.svg'
import ScanQRIcon from 'src/assets/icons/scan-qr.svg'
import { AccountHeader } from 'src/components/accounts/AccountHeader'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Button } from 'src/components/buttons/Button'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { SendButton } from 'src/components/buttons/SendButton'
import { NftsTab } from 'src/components/home/NftsTab'
import { TokensTab } from 'src/components/home/TokensTab'
import { Arrow } from 'src/components/icons/Arrow'
import { TxHistoryIconWithStatus } from 'src/components/icons/TxHistoryIconWithStatus'
import { Box, Flex } from 'src/components/layout'
import TabbedScrollScreen, {
  TabViewScrollProps,
} from 'src/components/layout/screens/TabbedScrollScreen'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { PortfolioBalance } from 'src/features/balances/PortfolioBalance'
import { useBiometricCheck } from 'src/features/biometrics/useBiometricCheck'
import { EXPERIMENTS, EXP_VARIANTS } from 'src/features/experiments/constants'
import { useExperimentVariant } from 'src/features/experiments/hooks'
import { openModal } from 'src/features/modals/modalSlice'
import { PendingNotificationBadge } from 'src/features/notifications/PendingNotificationBadge'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { useSortedPendingTransactions } from 'src/features/transactions/hooks'
import { AccountType } from 'src/features/wallet/accounts/types'
import { useTestAccount } from 'src/features/wallet/accounts/useTestAccount'
import { useActiveAccountWithThrow } from 'src/features/wallet/hooks'
import { removePendingSession } from 'src/features/walletConnect/walletConnectSlice'

const TOKENS_KEY = 'tokens'
const NFTS_KEY = 'nfts'

type Props = { queryRefs: HomeScreenQueries }

export function HomeScreen({ queryRefs }: Props) {
  // imports test account for easy development/testing
  useTestAccount()
  useBiometricCheck()
  const activeAccount = useActiveAccountWithThrow()
  const { t } = useTranslation()
  const theme = useAppTheme()
  const navigation = useAppStackNavigation()

  const onPressHamburger = useCallback(() => {
    navigation.dispatch(DrawerActions.openDrawer())
  }, [navigation])

  const { preload, navigate } = useEagerActivityNavigation()
  const onPressNotifications = useCallback(() => {
    navigate(activeAccount.address)
  }, [activeAccount.address, navigate])

  const onPressInNotifications = useCallback(() => {
    preload(activeAccount.address)
  }, [activeAccount.address, preload])

  const sortedPendingTransactions = useSortedPendingTransactions(activeAccount.address)

  const tabsExperimentVariant = useExperimentVariant(
    EXPERIMENTS.StickyTabsHeader,
    EXP_VARIANTS.Tabs
  )

  const contentHeader = useMemo(() => {
    return (
      <Flex bg="background0" gap="sm" pb="md">
        <AccountHeader />
        <Flex gap="sm" px="lg">
          <PortfolioBalance queryRef={queryRefs.portfolioBalanceQueryRef} />
          {activeAccount.type !== AccountType.Readonly && (
            <Flex pt="xxs">
              <QuickActions />
            </Flex>
          )}
        </Flex>
      </Flex>
    )
  }, [activeAccount.type, queryRefs.portfolioBalanceQueryRef])

  const scrollHeader = useMemo(() => {
    if (!tabsExperimentVariant || tabsExperimentVariant === EXP_VARIANTS.Tabs) return

    const shouldShowActions = [
      EXP_VARIANTS.TitleActions.valueOf(),
      EXP_VARIANTS.ActionsTitlesTabs.valueOf(),
    ].includes(tabsExperimentVariant)

    return (
      <Flex row justifyContent="space-between" px="lg" py="xs">
        {shouldShowActions ? (
          <Button justifyContent="center" onPress={onPressHamburger}>
            <HamburgerIcon
              color={theme.colors.textSecondary}
              height={theme.iconSizes.md}
              width={theme.iconSizes.md}
            />
          </Button>
        ) : (
          <Box />
        )}
        <AddressDisplay address={activeAccount.address} variant="subheadLarge" />
        {shouldShowActions ? (
          <Button
            justifyContent="center"
            onPress={onPressNotifications}
            onPressIn={onPressInNotifications}>
            {sortedPendingTransactions?.length ? (
              <PendingNotificationBadge sortedPendingTransactions={sortedPendingTransactions} />
            ) : (
              <TxHistoryIconWithStatus />
            )}
          </Button>
        ) : (
          <Box />
        )}
      </Flex>
    )
  }, [
    activeAccount.address,
    sortedPendingTransactions,
    onPressHamburger,
    onPressInNotifications,
    onPressNotifications,
    tabsExperimentVariant,
    theme.colors.textSecondary,
    theme.iconSizes.md,
  ])

  const renderTab = useMemo(() => {
    return (route: Route, scrollProps: TabViewScrollProps, loadingContainerStyle: ViewStyle) => {
      switch (route?.key) {
        case NFTS_KEY:
          return (
            <NftsTab
              loadingContainerStyle={loadingContainerStyle}
              owner={activeAccount.address ?? ''}
              tabViewScrollProps={scrollProps}
            />
          )
        case TOKENS_KEY:
          return (
            <TokensTab
              loadingContainerStyle={loadingContainerStyle}
              owner={activeAccount.address}
              tabViewScrollProps={scrollProps}
            />
          )
      }
      return null
    }
  }, [activeAccount.address])

  return (
    <TabbedScrollScreen
      contentHeader={contentHeader}
      renderTab={renderTab}
      scrollHeader={scrollHeader}
      tabs={[
        { key: TOKENS_KEY, title: t('Tokens') },
        { key: NFTS_KEY, title: t('NFTs') },
      ]}
    />
  )
}

function QuickActions() {
  const theme = useAppTheme()
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const onPressReceive = () => {
    selectionAsync()
    dispatch(
      openModal({ name: ModalName.WalletConnectScan, initialState: ScannerModalState.WalletQr })
    )
  }

  // TODO: remove when buy flow ready
  const onPressScan = () => {
    selectionAsync()
    // in case we received a pending session from a previous scan after closing modal
    dispatch(removePendingSession())
    dispatch(
      openModal({ name: ModalName.WalletConnectScan, initialState: ScannerModalState.ScanQr })
    )
  }

  return (
    <Flex centered row gap="xs">
      <SendButton flex={1} />
      <PrimaryButton
        noTextScaling
        borderRadius="md"
        flex={1}
        icon={
          <ScanQRIcon color={theme.colors.textPrimary} height={20} strokeWidth={2} width={20} />
        }
        label={t('Scan')}
        name={
          // Note. Leaving as buy since scan will be reverted before launch
          ElementName.NavigateBuy
        }
        py="sm"
        testID={ElementName.NavigateBuy}
        variant="transparent"
        onPress={onPressScan}
      />
      <PrimaryButton
        noTextScaling
        borderRadius="md"
        flex={1}
        icon={<Arrow color={theme.colors.textPrimary} direction="s" size={theme.iconSizes.md} />}
        label={t('Receive')}
        name={ElementName.Receive}
        py="sm"
        testID={ElementName.Receive}
        variant="transparent"
        onPress={onPressReceive}
      />
    </Flex>
  )
}
