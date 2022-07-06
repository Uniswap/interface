import { DrawerActions } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { selectionAsync } from 'expo-haptics'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { AppStackParamList, useHomeStackNavigation } from 'src/app/navigation/types'
import ScanQRIcon from 'src/assets/icons/scan-qr.svg'
import SendIcon from 'src/assets/icons/send.svg'
import SwapIcon from 'src/assets/icons/swap.svg'
import WalletIcon from 'src/assets/icons/wallet.svg'
import { AccountHeader } from 'src/components/accounts/AccountHeader'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Button } from 'src/components/buttons/Button'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { AppBackground } from 'src/components/gradients/AppBackground'
import { PortfolioNFTsSection } from 'src/components/home/PortfolioNFTsSection'
import { PortfolioTokensSection } from 'src/components/home/PortfolioTokensSection'
import { Box, Flex } from 'src/components/layout'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import { RelativeChange } from 'src/components/text/RelativeChange'
import { WalletConnectModalState } from 'src/components/WalletConnect/ScanSheet/WalletConnectModal'
import { TotalBalance } from 'src/features/balances/TotalBalance'
import { BiometricCheck } from 'src/features/biometrics'
import { useActiveChainIds } from 'src/features/chains/utils'
import { useAllBalancesByChainId } from 'src/features/dataApi/balances'
import { openModal } from 'src/features/modals/modalSlice'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { useTestAccount } from 'src/features/wallet/accounts/useTestAccount'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { removePendingSession } from 'src/features/walletConnect/walletConnectSlice'
import { Screens } from 'src/screens/Screens'
import { isWalletConnectSupportedAccount } from 'src/utils/walletConnect'

type Props = NativeStackScreenProps<AppStackParamList, Screens.TabNavigator>

export function HomeScreen({ navigation }: Props) {
  // imports test account for easy development/testing
  useTestAccount()

  const activeAccount = useActiveAccount()
  const currentChains = useActiveChainIds()

  const dispatch = useAppDispatch()
  const theme = useAppTheme()

  const { balances } = useAllBalancesByChainId(activeAccount?.address, currentChains)

  const onPressScan = () => {
    selectionAsync()
    // in case we received a pending session from a previous scan after closing modal
    dispatch(removePendingSession())
    dispatch(
      openModal({ name: ModalName.WalletConnectScan, initialState: WalletConnectModalState.ScanQr })
    )
  }

  const onPressAccountHeader = () => {
    navigation.dispatch(DrawerActions.toggleDrawer())
  }

  return (
    <>
      <HeaderScrollScreen
        background={<AppBackground isStrongAccent />}
        contentHeader={
          <Box alignItems="center" flexDirection="row" justifyContent="space-between" mx="xs">
            <AccountHeader onPress={onPressAccountHeader} />
            {activeAccount && isWalletConnectSupportedAccount(activeAccount) && (
              <Button name={ElementName.WalletConnectScan} onPress={onPressScan}>
                <ScanQRIcon color={theme.colors.textSecondary} height={22} width={22} />
              </Button>
            )}
          </Box>
        }
        fixedHeader={
          <Flex centered mb="xxs">
            {activeAccount && (
              <AddressDisplay address={activeAccount.address} variant="mediumLabel" />
            )}
          </Flex>
        }>
        <Flex gap="lg" mx="lg" my="lg">
          <Flex gap="xxs">
            <TotalBalance balances={balances} />
            <RelativeChange change={4.2} variant="body" />
          </Flex>
          <QuickActions />
        </Flex>
        <Flex gap="md" mx="md">
          <PortfolioTokensSection count={4} />
          <PortfolioNFTsSection count={16} />
        </Flex>
      </HeaderScrollScreen>
      {/* TODO: remove when app secures funds  */}
      <BiometricCheck />
    </>
  )
}

function QuickActions() {
  const theme = useAppTheme()
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const navigation = useHomeStackNavigation()

  const onPressSwap = () => {
    dispatch(openModal({ name: ModalName.Swap }))
  }
  const onPressSend = () => {
    navigation.navigate(Screens.Transfer, {})
  }

  return (
    <Flex centered row gap="xs">
      <PrimaryButton
        borderRadius="lg"
        flex={1}
        icon={
          <WalletIcon color={theme.colors.mainForeground} height={20} strokeWidth={2} width={20} />
        }
        label={t('Buy')}
        name={ElementName.NavigateBuy}
        py="sm"
        testID={ElementName.NavigateBuy}
        variant="transparent"
        onPress={onPressSwap}
      />
      <PrimaryButton
        borderRadius="lg"
        flex={1}
        icon={
          <SwapIcon color={theme.colors.mainForeground} height={20} strokeWidth={2} width={20} />
        }
        label={t('Swap')}
        name={ElementName.NavigateSwap}
        py="sm"
        testID={ElementName.NavigateSwap}
        variant="transparent"
        onPress={onPressSwap}
      />
      <PrimaryButton
        borderRadius="lg"
        flex={1}
        icon={
          <SendIcon height={20} stroke={theme.colors.mainForeground} strokeWidth={2} width={20} />
        }
        label={t('Send')}
        name={ElementName.NavigateSend}
        py="sm"
        testID={ElementName.NavigateSend}
        variant="transparent"
        onPress={onPressSend}
      />
    </Flex>
  )
}
