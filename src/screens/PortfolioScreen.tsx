import { DrawerActions } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Currency } from '@uniswap/sdk-core'
import { selectionAsync } from 'expo-haptics'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppStackParamList } from 'src/app/navigation/types'
import Clock from 'src/assets/icons/clock.svg'
import Scan from 'src/assets/icons/scan.svg'
import Settings from 'src/assets/icons/settings.svg'
import { AccountHeader } from 'src/components/accounts/AccountHeader'
import { Button } from 'src/components/buttons/Button'
import { usePrimaryToSecondaryLinearGradient } from 'src/components/gradients'
import { LinearGradientBox } from 'src/components/gradients/LinearGradient'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { TokenBalanceList } from 'src/components/TokenBalanceList/TokenBalanceList'
import { TotalBalance } from 'src/features/balances/TotalBalance'
import { BiometricCheck } from 'src/features/biometrics'
import { useActiveChainIds } from 'src/features/chains/utils'
import { useAllBalancesByChainId } from 'src/features/dataApi/balances'
import { ElementName } from 'src/features/telemetry/constants'
import { TransactionStatusBanner } from 'src/features/transactions/TransactionStatusBanner'
import { useTestAccount } from 'src/features/wallet/accounts/useTestAccount'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { WalletConnectScanSheet } from 'src/features/walletConnect/WalletConnectScanSheet'
import { Screens } from 'src/screens/Screens'
import { sleep } from 'src/utils/timing'
import { isWalletConnectSupportedAccount } from 'src/utils/walletConnect'

type Props = NativeStackScreenProps<AppStackParamList, Screens.TabNavigator>

export function PortfolioScreen({ navigation }: Props) {
  // imports test account for easy development/testing
  useTestAccount()

  const { t } = useTranslation()

  const activeAccount = useActiveAccount()
  const currentChains = useActiveChainIds()

  const { balances, loading } = useAllBalancesByChainId(activeAccount?.address, currentChains)

  const [refreshing, setRefreshing] = useState(false)
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    // TODO: this is a callback to give illusion of refreshing, in future we can spin until the next block number has updated
    sleep(300).then(() => setRefreshing(false))
  }, [])

  const [showWalletConnectModal, setShowWalletConnectModal] = useState(false)

  const onPressNotifications = () => navigation.navigate(Screens.Notifications)

  const onPressToken = (currency: Currency) =>
    navigation.navigate(Screens.TokenDetails, { currency })

  const onPressSettings = () =>
    navigation.navigate(Screens.SettingsStack, { screen: Screens.Settings })

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
    <Screen edges={['top', 'left', 'right']}>
      <LinearGradientBox height="50%" opacity={0.1} stops={gradientStops} />
      <Flex gap="md" mt="lg" mx="lg">
        <Box alignItems="center" flexDirection="row" justifyContent="space-between">
          <AccountHeader onPress={onPressAccountHeader} />
          <Flex centered row>
            {isWalletConnectSupportedAccount(activeAccount) && (
              <Button name={ElementName.WalletConnectScan} onPress={onPressScan}>
                <Scan height={20} stroke="deprecated_gray100" width={20} />
              </Button>
            )}
            <Button name={ElementName.Settings} onPress={onPressSettings}>
              <Settings height={24} stroke="deprecated_gray100" width={24} />
            </Button>
            <Button name={ElementName.Notifications} onPress={onPressNotifications}>
              <Clock height={24} stroke="deprecated_gray100" width={24} />
            </Button>
          </Flex>
        </Box>
        <TransactionStatusBanner />
        <Flex gap="xs">
          <Text color="deprecated_gray600" variant="bodySm">
            {t('Total Balance')}
          </Text>
          <Flex alignItems="flex-start" flexDirection="row" gap="sm">
            <TotalBalance balances={balances} />
          </Flex>
        </Flex>
        <WalletConnectScanSheet
          isVisible={showWalletConnectModal}
          onClose={() => setShowWalletConnectModal(false)}
        />
      </Flex>
      <Box bg="mainBackground" flex={1}>
        <TokenBalanceList
          balances={balances}
          loading={loading}
          refreshing={refreshing}
          onPressToken={onPressToken}
          onRefresh={onRefresh}
        />
      </Box>
      {/* TODO: remove when app secures funds  */}
      <BiometricCheck />
    </Screen>
  )
}
