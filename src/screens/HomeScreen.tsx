import { DrawerActions } from '@react-navigation/native'
import { selectionAsync } from 'expo-haptics'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { useHomeStackNavigation } from 'src/app/navigation/types'
import CameraScan from 'src/assets/icons/camera-scan.svg'
import ScanQRIcon from 'src/assets/icons/scan-qr.svg'
import SwapIcon from 'src/assets/icons/swap.svg'
import { AccountHeader } from 'src/components/accounts/AccountHeader'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Button } from 'src/components/buttons/Button'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { SendButton } from 'src/components/buttons/SendButton'
import { AppBackground } from 'src/components/gradients/AppBackground'
import { PortfolioNFTsSection } from 'src/components/home/PortfolioNFTsSection'
import { PortfolioTokensSection } from 'src/components/home/PortfolioTokensSection'
import { Box, Flex } from 'src/components/layout'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import { WalletConnectModalState } from 'src/components/WalletConnect/ScanSheet/WalletConnectModal'
import { TotalBalance } from 'src/features/balances/TotalBalance'
import { useActiveChainIds } from 'src/features/chains/utils'
import { useAllBalancesByChainId } from 'src/features/dataApi/balances'
import { openModal } from 'src/features/modals/modalSlice'
import { promptPushPermission } from 'src/features/notifications/Onesignal'
import { PendingNotificationBadge } from 'src/features/notifications/PendingNotificationBadge'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { useTestAccount } from 'src/features/wallet/accounts/useTestAccount'
import {
  useActiveAccount,
  useActiveAccountAddressWithThrow,
  useActiveAccountWithThrow,
} from 'src/features/wallet/hooks'
import { removePendingSession } from 'src/features/walletConnect/walletConnectSlice'
import { isWalletConnectSupportedAccount } from 'src/utils/walletConnect'

export function HomeScreen() {
  // imports test account for easy development/testing
  useTestAccount()
  promptPushPermission()

  const activeAccount = useActiveAccount()
  const currentChains = useActiveChainIds()

  const { balances } = useAllBalancesByChainId(activeAccount?.address, currentChains)

  return (
    <>
      <HeaderScrollScreen
        background={<AppBackground isStrongAccent />}
        contentHeader={<ContentHeader />}
        fixedHeader={<FixedHeader />}>
        <Flex gap="sm" px="sm">
          <Flex gap="lg" p="sm">
            <TotalBalance showRelativeChange balances={balances} />
            <QuickActions />
          </Flex>
          <Flex gap="sm">
            <PortfolioTokensSection count={4} />
            <PortfolioNFTsSection count={6} />
          </Flex>
        </Flex>
      </HeaderScrollScreen>
    </>
  )
}

function FixedHeader() {
  const activeAccountAddress = useActiveAccountAddressWithThrow()
  return (
    <Flex centered mb="xxs">
      <AddressDisplay address={activeAccountAddress} variant="mediumLabel" />
    </Flex>
  )
}

function ContentHeader() {
  const navigation = useHomeStackNavigation()
  const dispatch = useAppDispatch()
  const theme = useAppTheme()

  const onPressScan = useCallback(() => {
    selectionAsync()
    // in case we received a pending session from a previous scan after closing modal
    dispatch(removePendingSession())
    dispatch(
      openModal({ name: ModalName.WalletConnectScan, initialState: WalletConnectModalState.ScanQr })
    )
  }, [dispatch])

  const onPressAccountHeader = useCallback(() => {
    navigation.dispatch(DrawerActions.openDrawer())
  }, [navigation])

  const activeAccount = useActiveAccountWithThrow()

  return (
    <Box alignItems="center" flexDirection="row" justifyContent="space-between" px="xs" py="sm">
      <AccountHeader onPress={onPressAccountHeader} />
      <Flex row gap="xs">
        <PendingNotificationBadge />
        {isWalletConnectSupportedAccount(activeAccount) && (
          <Button name={ElementName.WalletConnectScan} onPress={onPressScan}>
            <ScanQRIcon color={theme.colors.textSecondary} height={24} width={24} />
          </Button>
        )}
      </Flex>
    </Box>
  )
}

function QuickActions() {
  const theme = useAppTheme()
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const onPressSwap = () => {
    dispatch(openModal({ name: ModalName.Swap }))
  }

  // TODO: remove when buy flow ready
  const onPressScan = () => {
    selectionAsync()
    // in case we received a pending session from a previous scan after closing modal
    dispatch(removePendingSession())
    dispatch(
      openModal({ name: ModalName.WalletConnectScan, initialState: WalletConnectModalState.ScanQr })
    )
  }

  return (
    <Flex centered row gap="xs">
      <PrimaryButton
        borderRadius="md"
        flex={1}
        icon={
          <CameraScan color={theme.colors.textPrimary} height={20} strokeWidth={2} width={20} />
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
        borderRadius="md"
        flex={1}
        icon={<SwapIcon color={theme.colors.textPrimary} height={20} strokeWidth={2} width={20} />}
        label={t('Swap')}
        name={ElementName.NavigateSwap}
        py="sm"
        testID={ElementName.NavigateSwap}
        variant="transparent"
        onPress={onPressSwap}
      />
      <SendButton flex={1} />
    </Flex>
  )
}
