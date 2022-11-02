import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { NoTransactions } from 'src/components/icons/NoTransactions'
import { Flex } from 'src/components/layout'
import { BackHeader } from 'src/components/layout/BackHeader'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Screen } from 'src/components/layout/Screen'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { Text } from 'src/components/Text'
import TransactionList from 'src/components/TransactionList/TransactionList'
import { openModal } from 'src/features/modals/modalSlice'
import { setNotificationStatus } from 'src/features/notifications/notificationSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { AccountType } from 'src/features/wallet/accounts/types'
import { useActiveAccountWithThrow } from 'src/features/wallet/hooks'
import { removePendingSession } from 'src/features/walletConnect/walletConnectSlice'
import { Screens } from 'src/screens/Screens'

export function ActivityScreen({ route }: AppStackScreenProp<Screens.Activity>) {
  const { preloadedQuery } = route.params

  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const { address, type } = useActiveAccountWithThrow()
  const readonly = type === AccountType.Readonly

  // TODO: remove when buy flow ready
  const onPressScan = () => {
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
    <Screen>
      <BackHeader p="md">
        <Text variant="buttonLabelMedium">{t('Activity')}</Text>
      </BackHeader>
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
    </Screen>
  )
}
