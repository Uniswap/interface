import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ViewStyle } from 'react-native'
import { AppStackParamList } from 'src/app/navigation/types'
import Clock from 'src/assets/icons/clock.svg'
import QrCode from 'src/assets/icons/qr-code.svg'
import Settings from 'src/assets/icons/settings.svg'
import { AccountCardList } from 'src/components/AccountCardList/AccountCardList'
import { AccountHeader } from 'src/components/accounts/AccountHeader'
import { Button } from 'src/components/buttons/Button'
import { GradientBackground } from 'src/components/gradients/GradientBackground'
import { PinkToBlueLinear } from 'src/components/gradients/PinkToBlueLinear'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { WalletQRCode } from 'src/components/modals/WalletQRCode'
import { Text } from 'src/components/Text'
import { TokenBalanceList } from 'src/components/TokenBalanceList'
import { useAllBalances } from 'src/features/balances/hooks'
import { TotalBalance } from 'src/features/balances/TotalBalance'
import { useActiveChainIds } from 'src/features/chains/utils'
import { isEnabled } from 'src/features/remoteConfig'
import { TestConfig } from 'src/features/remoteConfig/testConfigs'
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

  const { t } = useTranslation()

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

  const onPressSend = () => {
    navigation.navigate(Screens.Transfer)
  }

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
    <Screen edges={['top', 'left', 'right']}>
      <GradientBackground height="50%">
        <PinkToBlueLinear />
      </GradientBackground>
      <Box>
        <Box alignItems="center" flexDirection="row" justifyContent="space-between" mx="md" my="sm">
          <AccountHeader />
          <Box flexDirection="row" mr="md">
            <Button mr="md" onPress={onPressSettings}>
              <Settings height={24} stroke="gray100" width={24} />
            </Button>
            <Button onPress={onPressNotifications}>
              <Clock height={24} stroke="gray100" width={24} />
            </Button>
          </Box>
        </Box>
        <TransactionStatusBanner />
        {isEnabled(TestConfig.SWIPEABLE_ACCOUNTS) ? (
          <AccountCardList
            balances={balances}
            onPressQRCode={onPressQRCode}
            onPressSend={onPressSend}
          />
        ) : (
          <Box alignItems="flex-end" flexDirection="row" justifyContent="space-between">
            <Box m="lg">
              <Text mb="md" variant="h4">
                {t('Total Balance')}
              </Text>
              <TotalBalance balances={balances} />
            </Box>
            <Button
              backgroundColor="white"
              mx="lg"
              my="lg"
              padding="md"
              style={headerButtonStyle}
              onPress={onPressQRCode}>
              <QrCode height={15} stroke={theme.colors.pink} width={15} />
            </Button>
          </Box>
        )}

        <WalletQRCode isVisible={showQRModal} onClose={onCloseQrCode} />
      </Box>
      <Box bg="mainBackground" flex={1}>
        <TokenBalanceList
          balances={balances}
          loading={loading && !allCurrencyAmounts.length}
          refreshing={refreshing}
          onPressToken={onPressToken}
          onRefresh={onRefresh}
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
