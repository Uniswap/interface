import { DrawerActions } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { selectionAsync } from 'expo-haptics'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import { AppStackParamList, useHomeStackNavigation } from 'src/app/navigation/types'
import Scan from 'src/assets/icons/scan.svg'
import SendIcon from 'src/assets/icons/send.svg'
import SwapIcon from 'src/assets/icons/swap.svg'
import WalletIcon from 'src/assets/icons/wallet.svg'
import { AccountHeader } from 'src/components/accounts/AccountHeader'
import { Button } from 'src/components/buttons/Button'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { AppBackground } from 'src/components/gradients'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { VirtualizedList } from 'src/components/layout/VirtualizedList'
import { openModal } from 'src/features/modals/modalSlice'
import { RelativeChange } from 'src/components/text/RelativeChange'
import { WalletConnectModalState } from 'src/components/WalletConnect/ScanSheet/WalletConnectModal'
import { TotalBalance } from 'src/features/balances/TotalBalance'
import { BiometricCheck } from 'src/features/biometrics'
import { useActiveChainIds } from 'src/features/chains/utils'
import { useAllBalancesByChainId } from 'src/features/dataApi/balances'
import { NotificationCenterLogo } from 'src/features/notifications/NotificationCenterLogo'
import { selectHasUnreadNotifications } from 'src/features/notifications/selectors'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { useTestAccount } from 'src/features/wallet/accounts/useTestAccount'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { removePendingSession } from 'src/features/walletConnect/walletConnectSlice'
import { NFTMasonry } from 'src/screens/PortfolioNFTs'
import { PortfolioTokens } from 'src/screens/PortfolioTokens'
import { Screens } from 'src/screens/Screens'
import { spacing } from 'src/styles/sizing'
import { isWalletConnectSupportedAccount } from 'src/utils/walletConnect'

const NOTIFICATION_INDICATOR_SIZE = 8

type Props = NativeStackScreenProps<AppStackParamList, Screens.TabNavigator>

export function HomeScreen({ navigation }: Props) {
  // imports test account for easy development/testing
  useTestAccount()

  const dispatch = useAppDispatch()
  const theme = useAppTheme()

  const activeAccount = useActiveAccount()
  const currentChains = useActiveChainIds()

  const { balances } = useAllBalancesByChainId(activeAccount?.address, currentChains)

  const onPressNotifications = () => navigation.navigate(Screens.Notifications)

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

  if (!activeAccount)
    return (
      <Screen>
        <Box mx="md" my="sm">
          <AccountHeader onPress={onPressAccountHeader} />
        </Box>
      </Screen>
    )

  return (
    <Screen edges={['left', 'right']}>
      <AppBackground />
      <Box mt="xl" mx="md">
        <NotificationIndicator />
        <VirtualizedList>
          <Flex gap="lg" my="lg">
            <Box alignItems="center" flexDirection="row" justifyContent="space-between">
              <AccountHeader onPress={onPressAccountHeader} />
              <Flex centered row>
                {isWalletConnectSupportedAccount(activeAccount) && (
                  <Button name={ElementName.WalletConnectScan} onPress={onPressScan}>
                    <Scan color={theme.colors.neutralTextTertiary} height={20} width={20} />
                  </Button>
                )}
                <Button name={ElementName.Notifications} width={28} onPress={onPressNotifications}>
                  <NotificationCenterLogo />
                </Button>
              </Flex>
            </Box>
            <Flex centered gap="xxs">
              <TotalBalance balances={balances} />
              <RelativeChange change={4.2} variant="body1" />
            </Flex>
            <QuickActions />
          </Flex>
          <Flex gap="md">
            <PortfolioTokens count={4} />
            <NFTMasonry count={16} />
          </Flex>
        </VirtualizedList>
      </Box>
      {/* TODO: remove when app secures funds  */}
      <BiometricCheck />
    </Screen>
  )
}

function NotificationIndicator() {
  const hasUnreadNotifications = useAppSelector(selectHasUnreadNotifications)
  return (
    <Box
      backgroundColor={hasUnreadNotifications ? 'accentBackgroundAction' : 'neutralTextTertiary'}
      borderRadius="full"
      height={NOTIFICATION_INDICATOR_SIZE}
      left={-(NOTIFICATION_INDICATOR_SIZE / 2) + -spacing.md} // half of inicator width + `mx` of Home Screen
      position="absolute"
      top={-(NOTIFICATION_INDICATOR_SIZE / 2) + spacing.xl} // half of inicator height + `mt` of Home Screen
      width={NOTIFICATION_INDICATOR_SIZE}
    />
  )
}

function QuickActions() {
  const theme = useAppTheme()
  const { t } = useTranslation()
  const navigation = useHomeStackNavigation()

  const onPressSwap = () => {
    navigation.navigate(Screens.Swap)
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
        style={{ backgroundColor: theme.colors.translucentBackground }}
        testID={ElementName.NavigateBuy}
        variant="gray"
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
        style={{ backgroundColor: theme.colors.translucentBackground }}
        testID={ElementName.NavigateSwap}
        variant="gray"
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
        style={{ backgroundColor: theme.colors.translucentBackground }}
        testID={ElementName.NavigateSend}
        variant="gray"
        onPress={onPressSend}
      />
    </Flex>
  )
}
