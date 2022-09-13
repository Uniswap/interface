import { selectionAsync } from 'expo-haptics'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import ScanQRIcon from 'src/assets/icons/scan-qr.svg'
import SwapIcon from 'src/assets/icons/swap.svg'
import { AccountHeader } from 'src/components/accounts/AccountHeader'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { SendButton } from 'src/components/buttons/SendButton'
import { AppBackground } from 'src/components/gradients/AppBackground'
import { PortfolioNFTsSection } from 'src/components/home/PortfolioNFTsSection'
import { PortfolioTokensSection } from 'src/components/home/PortfolioTokensSection'
import { Flex } from 'src/components/layout'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { TotalBalance } from 'src/features/balances/TotalBalance'
import { useBiometricCheck } from 'src/features/biometrics/useBiometricCheck'
import { openModal } from 'src/features/modals/modalSlice'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { AccountType } from 'src/features/wallet/accounts/types'
import { useTestAccount } from 'src/features/wallet/accounts/useTestAccount'
import {
  useActiveAccountAddressWithThrow,
  useActiveAccountWithThrow,
} from 'src/features/wallet/hooks'
import { removePendingSession } from 'src/features/walletConnect/walletConnectSlice'

export function HomeScreen() {
  // imports test account for easy development/testing
  useTestAccount()
  useBiometricCheck()
  const activeAccount = useActiveAccountWithThrow()

  return (
    <>
      <HeaderScrollScreen
        background={<AppBackground />}
        contentHeader={<AccountHeader />}
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
      openModal({ name: ModalName.WalletConnectScan, initialState: ScannerModalState.ScanQr })
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
