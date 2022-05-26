import { DrawerActions } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { selectionAsync } from 'expo-haptics'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, useColorScheme } from 'react-native'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { AppStackParamList, useHomeStackNavigation } from 'src/app/navigation/types'
import Scan from 'src/assets/icons/scan.svg'
import SendIcon from 'src/assets/icons/send.svg'
import SwapIcon from 'src/assets/icons/swap.svg'
import WalletIcon from 'src/assets/icons/wallet.svg'
import { AccountHeader } from 'src/components/accounts/AccountHeader'
import { Button } from 'src/components/buttons/Button'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { getStops } from 'src/components/gradients'
import { RadialGradientBox } from 'src/components/gradients/RadialGradient'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { RelativeChange } from 'src/components/text/RelativeChange'
import { WalletConnectModalState } from 'src/components/WalletConnect/ScanSheet/WalletConnectModal'
import { TotalBalance } from 'src/features/balances/TotalBalance'
import { BiometricCheck } from 'src/features/biometrics'
import { useActiveChainIds } from 'src/features/chains/utils'
import { useAllBalancesByChainId } from 'src/features/dataApi/balances'
import { NotificationCenterLogo } from 'src/features/notifications/NotificationCenterLogo'
import { ElementName } from 'src/features/telemetry/constants'
import { useTestAccount } from 'src/features/wallet/accounts/useTestAccount'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { setWalletConnectModalState } from 'src/features/walletConnect/walletConnectSlice'
import { NFTMasonry } from 'src/screens/PortfolioNFTs'
import { PortfolioTokens } from 'src/screens/PortfolioTokens'
import { Screens } from 'src/screens/Screens'
import { isWalletConnectSupportedAccount } from 'src/utils/walletConnect'

type Props = NativeStackScreenProps<AppStackParamList, Screens.TabNavigator>

export function HomeScreen({ navigation }: Props) {
  // imports test account for easy development/testing
  useTestAccount()

  const dispatch = useAppDispatch()
  const theme = useAppTheme()
  const darkMode = useColorScheme() === 'dark'

  const activeAccount = useActiveAccount()
  const currentChains = useActiveChainIds()

  const { balances } = useAllBalancesByChainId(activeAccount?.address, currentChains)

  const onPressNotifications = () => navigation.navigate(Screens.Notifications)

  const onPressScan = () => {
    selectionAsync()
    dispatch(setWalletConnectModalState({ modalState: WalletConnectModalState.ScanQr }))
  }

  const onPressAccountHeader = () => {
    navigation.dispatch(DrawerActions.toggleDrawer())
  }

  const stops = useMemo(
    () =>
      getStops(
        theme.colors.deprecated_primary1,
        theme.colors.mainBackground,
        theme.colors.mainBackground
      ),
    [theme.colors.deprecated_primary1, theme.colors.mainBackground]
  )

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
      <RadialGradientBox opacity={darkMode ? 0.4 : 0.2} stops={stops} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Box mt="xl" mx="md">
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
        </Box>
      </ScrollView>
      {/* TODO: remove when app secures funds  */}
      <BiometricCheck />
    </Screen>
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
