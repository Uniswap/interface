import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import React, { useCallback, useRef, useState } from 'react'
import { AppStackParamList } from 'src/app/navigation/types'
import Clock from 'src/assets/icons/clock.svg'
import Settings from 'src/assets/icons/settings.svg'
import { AccountHeader } from 'src/components/accounts/AccountHeader'
import { Button } from 'src/components/buttons/Button'
import { GradientBackground } from 'src/components/gradients/GradientBackground'
import { PinkToBlueLinear } from 'src/components/gradients/PinkToBlueLinear'
import { Box } from 'src/components/layout/Box'
import { Screen, sheetScreenEdges } from 'src/components/layout/Screen'
import { TokenBalanceList } from 'src/components/TokenBalanceList'
import { useAllBalances } from 'src/features/balances/hooks'
import { useActiveChainIds } from 'src/features/chains/utils'
import { useAllTokens } from 'src/features/tokens/useTokens'
import { TransactionNotificationBanner } from 'src/features/transactions/Notification'
import { useTestAccount } from 'src/features/wallet/accounts/useTestAccount'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { NotificationsScreen } from 'src/screens/NotificationsScreen'
import { Screens } from 'src/screens/Screens'
import { bottomSheetStyles, FULL_SNAP_POINTS } from 'src/styles/bottomSheet'
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

  const onPressToken = (currencyAmount: CurrencyAmount<Currency>) =>
    navigation.navigate(Screens.TokenDetails, { currency: currencyAmount.currency })

  const onPressSettings = () =>
    navigation.navigate(Screens.SettingsStack, { screen: Screens.Settings })

  const notificationsModalRef = useRef<BottomSheetModal>(null)
  const onPressNotifications = () => notificationsModalRef.current?.present()
  const onCloseNotifications = () => notificationsModalRef.current?.dismiss()

  if (!activeAccount)
    return (
      <Screen>
        <Box mx="md" my="sm">
          <AccountHeader />
        </Box>
      </Screen>
    )

  return (
    <Screen edges={sheetScreenEdges}>
      <GradientBackground height="33%">
        <PinkToBlueLinear />
      </GradientBackground>
      <Box flexDirection="row" alignItems="center" justifyContent="space-between" mx="md" my="sm">
        <AccountHeader />
        <Box flexDirection="row" mr="md">
          <Button onPress={onPressSettings} mr="md">
            <Settings height={24} width={24} />
          </Button>
          <Button onPress={onPressNotifications}>
            <Clock height={24} width={24} />
          </Button>
        </Box>
      </Box>
      <TransactionNotificationBanner />
      <TokenBalanceList
        loading={loading && !allCurrencyAmounts.length}
        balances={balances}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onPressToken={onPressToken}
      />
      <BottomSheetModal
        ref={notificationsModalRef}
        index={0}
        snapPoints={FULL_SNAP_POINTS}
        style={bottomSheetStyles.bottomSheet}>
        <NotificationsScreen onPressClose={onCloseNotifications} />
      </BottomSheetModal>
    </Screen>
  )
}
