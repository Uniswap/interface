import { DrawerActions } from '@react-navigation/native'
import { selectionAsync } from 'expo-haptics'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { useHomeStackNavigation } from 'src/app/navigation/types'
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
import { Pill } from 'src/components/text/Pill'
import { WalletConnectModalState } from 'src/components/WalletConnect/constants'
import { TotalBalance } from 'src/features/balances/TotalBalance'
import { BiometricCheck } from 'src/features/biometrics/BiometricCheck'
import { openModal } from 'src/features/modals/modalSlice'
import { PendingNotificationBadge } from 'src/features/notifications/PendingNotificationBadge'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { AccountType } from 'src/features/wallet/accounts/types'
import { useTestAccount } from 'src/features/wallet/accounts/useTestAccount'
import {
  useActiveAccountAddressWithThrow,
  useActiveAccountWithThrow,
} from 'src/features/wallet/hooks'
import { removePendingSession } from 'src/features/walletConnect/walletConnectSlice'
import { isWalletConnectSupportedAccount } from 'src/utils/walletConnect'

export function HomeScreen() {
  // imports test account for easy development/testing
  useTestAccount()
  const activeAccount = useActiveAccountWithThrow()

  return (
    <>
      <HeaderScrollScreen
        background={<AppBackground isStrongAccent />}
        contentHeader={<ContentHeader />}
        fixedHeader={<FixedHeader />}>
        <Flex gap="lg" px="sm">
          <Flex gap="md" p="sm">
            <TotalBalance showRelativeChange owner={activeAccount.address} />
            {activeAccount?.type !== AccountType.Readonly && (
              <Flex pt="xxs">
                <QuickActions />
              </Flex>
            )}
          </Flex>
          <Flex gap="sm">
            <PortfolioTokensSection count={4} owner={activeAccount.address} />
            <PortfolioNFTsSection count={6} owner={activeAccount.address} />
          </Flex>
        </Flex>
      </HeaderScrollScreen>
      <BiometricCheck />
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
    <Box
      alignItems="center"
      flexDirection="row"
      justifyContent="space-between"
      mb="xxs"
      mt="sm"
      px="xs"
      py="sm">
      <Flex row alignItems="center" gap="xs">
        <AccountHeader onPress={onPressAccountHeader} />
        {activeAccount?.type === AccountType.Readonly && (
          <Pill
            alignItems="center"
            borderRadius="xs"
            customBackgroundColor={theme.colors.backgroundContainer}
            foregroundColor={theme.colors.textPrimary}
            label="View only"
            px="xxs"
            py="xxs"
            textVariant="badge"
          />
        )}
      </Flex>
      <Flex row alignItems="center" gap="sm">
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
