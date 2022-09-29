import { selectionAsync } from 'expo-haptics'
import React, { Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View, ViewStyle } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { BaseCard } from 'src/components/layout/BaseCard'
import { TabViewScrollProps } from 'src/components/layout/screens/TabbedScrollScreen'
import { Loading } from 'src/components/loading'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { TokenBalanceList } from 'src/components/TokenBalanceList/TokenBalanceList'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import { openModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { removePendingSession } from 'src/features/walletConnect/walletConnectSlice'
import { theme } from 'src/styles/theme'
import { CurrencyId } from 'src/utils/currencyId'

export function TokensTab({
  owner,
  tabViewScrollProps,
  loadingContainerStyle,
}: {
  owner: string
  tabViewScrollProps: TabViewScrollProps
  loadingContainerStyle: ViewStyle
}) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const tokenDetailsNavigation = useTokenDetailsNavigation()

  const onPressToken = (currencyId: CurrencyId) => {
    tokenDetailsNavigation.navigate(currencyId)
  }
  const onPressTokenIn = (currencyId: CurrencyId) => {
    tokenDetailsNavigation.preload(currencyId)
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

  const styles = StyleSheet.create({
    tabContentStyle: {
      paddingHorizontal: theme.spacing.sm,
    },
  })

  return (
    <View style={styles.tabContentStyle}>
      <Suspense
        fallback={
          <View style={loadingContainerStyle}>
            <Loading showSeparator repeat={4} type="token" />
          </View>
        }>
        <TokenBalanceList
          empty={
            <BaseCard.EmptyState
              additionalButtonLabel={t('Transfer')}
              buttonLabel={t('Scan')}
              description={t(
                'Fund your wallet by buying tokens with a credit card or transferring from an exchange.'
              )}
              title={t('Add tokens')}
              onPress={onPressScan}
              onPressAdditional={onPressScan}
            />
          }
          owner={owner}
          tabViewScrollProps={tabViewScrollProps}
          onPressToken={onPressToken}
          onPressTokenIn={onPressTokenIn}
        />
      </Suspense>
    </View>
  )
}
