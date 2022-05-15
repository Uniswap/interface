import { DrawerActions } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { selectionAsync } from 'expo-haptics'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import { AppStackParamList, useHomeStackNavigation } from 'src/app/navigation/types'
import Clock from 'src/assets/icons/clock.svg'
import Scan from 'src/assets/icons/scan.svg'
import SendIcon from 'src/assets/icons/send.svg'
import SwapIcon from 'src/assets/icons/swap.svg'
import WalletIcon from 'src/assets/icons/wallet.svg'
import { AccountHeader } from 'src/components/accounts/AccountHeader'
import { Button } from 'src/components/buttons/Button'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { usePrimaryToSecondaryLinearGradient } from 'src/components/gradients'
import { LinearGradientBox } from 'src/components/gradients/LinearGradient'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { RelativeChange } from 'src/components/text/RelativeChange'
import { TotalBalance } from 'src/features/balances/TotalBalance'
import { BiometricCheck } from 'src/features/biometrics'
import { useActiveChainIds } from 'src/features/chains/utils'
import { useAllBalancesByChainId } from 'src/features/dataApi/balances'
import { ElementName } from 'src/features/telemetry/constants'
import { TransactionStatusBanner } from 'src/features/transactions/TransactionStatusBanner'
import { useTestAccount } from 'src/features/wallet/accounts/useTestAccount'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { WalletConnectScanSheet } from 'src/features/walletConnect/WalletConnectScanSheet'
import { NFTMasonry } from 'src/screens/PortfolioNFTs'
import { PortfolioTokens } from 'src/screens/PortfolioTokens'
import { Screens } from 'src/screens/Screens'
import { isWalletConnectSupportedAccount } from 'src/utils/walletConnect'

type Props = NativeStackScreenProps<AppStackParamList, Screens.TabNavigator>

export function HomeScreen({ navigation }: Props) {
  // imports test account for easy development/testing
  useTestAccount()

  const theme = useAppTheme()

  const activeAccount = useActiveAccount()
  const currentChains = useActiveChainIds()

  const { balances } = useAllBalancesByChainId(activeAccount?.address, currentChains)

  const [showWalletConnectModal, setShowWalletConnectModal] = useState(false)

  const onPressNotifications = () => navigation.navigate(Screens.Notifications)

  const onPressScan = () => {
    selectionAsync()
    setShowWalletConnectModal(true)
  }

  const onPressAccountHeader = () => {
    navigation.dispatch(DrawerActions.toggleDrawer())
  }

  const gradientStops = usePrimaryToSecondaryLinearGradient()

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
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradientBox height="100%" opacity={0.1} stops={gradientStops} />
        <Box mt="xl">
          <Flex gap="lg" mt="lg" mx="lg">
            <Box alignItems="center" flexDirection="row" justifyContent="space-between">
              <AccountHeader onPress={onPressAccountHeader} />
              <Flex centered row>
                {isWalletConnectSupportedAccount(activeAccount) && (
                  <Button name={ElementName.WalletConnectScan} onPress={onPressScan}>
                    <Scan color={theme.colors.neutralTextTertiary} height={20} width={20} />
                  </Button>
                )}
                <Button name={ElementName.Notifications} onPress={onPressNotifications}>
                  <Clock color={theme.colors.neutralTextTertiary} height={24} width={24} />
                </Button>
              </Flex>
            </Box>
            <TransactionStatusBanner />
            <Flex centered gap="sm">
              <TotalBalance balances={balances} />
              <RelativeChange change={4.2} variant="subHead1" />
            </Flex>
            <QuickActions />
            <WalletConnectScanSheet
              isVisible={showWalletConnectModal}
              onClose={() => setShowWalletConnectModal(false)}
            />
          </Flex>
          <Flex gap="xs">
            <PortfolioTokens count={4} />
            <NFTMasonry count={4} />
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
    <Flex centered row>
      <PrimaryButton
        flex={1}
        icon={
          <WalletIcon color={theme.colors.mainForeground} height={20} strokeWidth={2} width={20} />
        }
        label={t('Buy')}
        name={ElementName.BuyToken}
        style={{ backgroundColor: theme.colors.tabBackground }}
        testID={ElementName.BuyToken}
        variant="gray"
        onPress={onPressSwap}
      />
      <PrimaryButton
        flex={1}
        icon={
          <SwapIcon color={theme.colors.mainForeground} height={20} strokeWidth={2} width={20} />
        }
        label={t('Swap')}
        name={ElementName.Swap}
        style={{ backgroundColor: theme.colors.tabBackground }}
        testID={ElementName.Swap}
        variant="gray"
        onPress={onPressSwap}
      />
      <PrimaryButton
        flex={1}
        icon={
          <SendIcon height={20} stroke={theme.colors.mainForeground} strokeWidth={2} width={20} />
        }
        label={t('Send')}
        name={ElementName.Send}
        style={{ backgroundColor: theme.colors.tabBackground }}
        testID={ElementName.Send}
        variant="gray"
        onPress={onPressSend}
      />
    </Flex>
  )
}
