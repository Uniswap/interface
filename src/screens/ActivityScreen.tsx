import { selectionAsync } from 'expo-haptics'
import React, { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { AppStackScreenProp, useAppStackNavigation } from 'src/app/navigation/types'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { NoTransactions } from 'src/components/icons/NoTransactions'
import { Flex } from 'src/components/layout'
import { BackHeader } from 'src/components/layout/BackHeader'
import { BaseCard } from 'src/components/layout/BaseCard'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { Text } from 'src/components/Text'
import TransactionList from 'src/components/TransactionList/TransactionList'
import SessionsButton from 'src/components/WalletConnect/SessionsButton'
import { openModal } from 'src/features/modals/modalSlice'
import { setNotificationStatus } from 'src/features/notifications/notificationSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { AccountType } from 'src/features/wallet/accounts/types'
import { useActiveAccountWithThrow } from 'src/features/wallet/hooks'
import { useWalletConnect } from 'src/features/walletConnect/useWalletConnect'
import { removePendingSession } from 'src/features/walletConnect/walletConnectSlice'
import { Screens } from 'src/screens/Screens'

const MAX_SCROLL_HEIGHT = 180

export function ActivityScreen({ route }: AppStackScreenProp<Screens.Activity>) {
  const { preloadedQuery } = route.params

  const dispatch = useAppDispatch()
  const navigation = useAppStackNavigation()
  const { t } = useTranslation()
  const { address, type } = useActiveAccountWithThrow()
  const readonly = type === AccountType.Readonly

  const { sessions } = useWalletConnect(address)

  const onPressSessions = useCallback(() => {
    if (address) {
      navigation.navigate(Screens.SettingsWalletManageConnection, { address })
    }
  }, [address, navigation])

  // TODO: remove when buy flow ready
  const onPressScan = () => {
    selectionAsync()
    // in case we received a pending session from a previous scan after closing modal
    dispatch(removePendingSession())
    dispatch(
      openModal({ name: ModalName.WalletConnectScan, initialState: ScannerModalState.ScanQr })
    )
  }

  useEffect(() => {
    dispatch(setNotificationStatus({ address, hasNotifications: false }))
  }, [dispatch, address])

  return (
    <HeaderScrollScreen
      contentHeader={
        <BackHeader p="md">
          <Text variant="buttonLabelMedium">{t('Activity')}</Text>
        </BackHeader>
      }
      fixedHeader={
        <Flex centered>
          <AddressDisplay address={address} variant="subheadLarge" />
        </Flex>
      }
      maxScrollHeightOverride={MAX_SCROLL_HEIGHT}>
      {sessions.length > 0 && (
        <Flex px="sm">
          <SessionsButton sessions={sessions} onPress={onPressSessions} />
        </Flex>
      )}
      <Flex pb="lg" px="sm">
        <TransactionList
          emptyStateContent={
            <Flex centered flex={1}>
              <BaseCard.EmptyState
                buttonLabel={t('Receive tokens or NFTs')}
                description={t(
                  'When you approve, trade, or transfer tokens or NFTs, your transactions will appear here.'
                )}
                icon={<NoTransactions />}
                title={t('No tokens yet')}
                onPress={onPressScan}
              />
            </Flex>
          }
          ownerAddress={address}
          preloadedQuery={preloadedQuery}
          readonly={readonly}
        />
      </Flex>
    </HeaderScrollScreen>
  )
}
