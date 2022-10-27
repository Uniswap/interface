import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, ViewStyle } from 'react-native'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { Suspense } from 'src/components/data/Suspense'
import { NoTokens } from 'src/components/icons/NoTokens'
import { Box, Flex } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { TabViewScrollProps } from 'src/components/layout/screens/TabbedScrollScreen'
import { Loading } from 'src/components/loading'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { TokenBalanceList } from 'src/components/TokenBalanceList/TokenBalanceList'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import { openModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { removePendingSession } from 'src/features/walletConnect/walletConnectSlice'
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
  const theme = useAppTheme()
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
    <Flex grow style={styles.tabContentStyle}>
      <Suspense
        fallback={
          <Box m="sm" style={loadingContainerStyle}>
            <Loading repeat={4} type="token" />
          </Box>
        }>
        <TokenBalanceList
          empty={
            <Flex centered flex={1}>
              <BaseCard.EmptyState
                buttonLabel={t('Receive tokens')}
                description={t(
                  'Transfer tokens from a centralized exchange or another wallet to get started.'
                )}
                icon={<NoTokens />}
                title={t('No tokens yet')}
                onPress={onPressScan}
              />
            </Flex>
          }
          owner={owner}
          tabViewScrollProps={tabViewScrollProps}
          onPressToken={onPressToken}
          onPressTokenIn={onPressTokenIn}
        />
      </Suspense>
    </Flex>
  )
}
