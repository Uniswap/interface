import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import React, { useCallback, useState } from 'react'
import { ViewStyle } from 'react-native'
import { AppStackParamList } from 'src/app/navigation/types'
import Clock from 'src/assets/icons/clock.svg'
import QrCode from 'src/assets/icons/qr-code.svg'
import Settings from 'src/assets/icons/settings.svg'
import { AccountHeader } from 'src/components/accounts/AccountHeader'
import { Button } from 'src/components/buttons/Button'
import { GradientBackground } from 'src/components/gradients/GradientBackground'
import { PinkToBlueLinear } from 'src/components/gradients/PinkToBlueLinear'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { WalletQRCode } from 'src/components/modals/WalletQRCode'
import { TokenBalanceList } from 'src/components/TokenBalanceList'
import { useAllBalances } from 'src/features/balances/hooks'
import TotalBalance from 'src/features/balances/TotalBalance'
import { useActiveChainIds } from 'src/features/chains/utils'
import { useAllTokens } from 'src/features/tokens/useTokens'
import { TransactionStatusBanner } from 'src/features/transactions/TransactionStatusBanner'
import { useTestAccount } from 'src/features/wallet/accounts/useTestAccount'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'
import { theme } from 'src/styles/theme'
import { sleep } from 'src/utils/timing'

type Props = NativeStackScreenProps<AppStackParamList, Screens.TabNavigator>

export function HomeScreen({ navigation }: Props) {
  // imports test account for easy development/testing
  useTestAccount()
  const activeAccount = useActiveAccount()
  const currentChains = useActiveChainIds()
  const chainIdToTokens = useAllTokens()
  const { balances, allCurrencyAmounts, loading } = useAllBalances(
    currentChains,
    chainIdToTokens,
    activeAccount?.address
  )
  const [refreshing, setRefreshing] = useState(false)
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    // TODO: this is a callback to give illusion of refreshing, in future we can spin until the next block number has updated
    sleep(300).then(() => setRefreshing(false))
  }, [])

  const [showQRModal, setShowQRModal] = useState(false)
  const onPressQRCode = () => setShowQRModal(true)
  const onCloseQrCode = () => setShowQRModal(false)

  const onPressNotifications = () => navigation.navigate(Screens.Notifications)

  const onPressToken = (currencyAmount: CurrencyAmount<Currency>) =>
    navigation.navigate(Screens.TokenDetails, { currency: currencyAmount.currency })

  const onPressSettings = () =>
    navigation.navigate(Screens.SettingsStack, { screen: Screens.Settings })

  if (!activeAccount)
    return (
      <Screen>
        <Box mx="md" my="sm">
          <AccountHeader />
        </Box>
      </Screen>
    )

  return (
    <Screen>
      <GradientBackground height="50%">
        <PinkToBlueLinear />
      </GradientBackground>
      <Box>
        <Box flexDirection="row" alignItems="center" justifyContent="space-between" mx="md" my="sm">
          <AccountHeader />
          <Box flexDirection="row" mr="md">
            <Button onPress={onPressSettings} mr="md">
              <Settings stroke="gray100" height={24} width={24} />
            </Button>
            <Button onPress={onPressNotifications}>
              <Clock stroke="gray100" height={24} width={24} />
            </Button>
          </Box>
        </Box>
        <TransactionStatusBanner />
        <Box flexDirection="row" alignItems="flex-end" justifyContent="space-between">
          <TotalBalance balances={balances} />
          <Button
            onPress={onPressQRCode}
            mx="lg"
            my="lg"
            padding="md"
            style={headerButtonStyle}
            backgroundColor="white">
            <QrCode stroke={theme.colors.pink} height={15} width={15} />
          </Button>
        </Box>
        <WalletQRCode isVisible={showQRModal} onClose={onCloseQrCode} />
      </Box>
      <Box flex={1} backgroundColor="mainBackground">
        <TokenBalanceList
          loading={loading && !allCurrencyAmounts.length}
          balances={balances}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onPressToken={onPressToken}
        />
      </Box>
    </Screen>
  )
}

const headerButtonStyle: ViewStyle = {
  borderRadius: 16,
  borderColor: 'rgba(255, 0, 122, 0.2)',
  borderWidth: 1,
}
