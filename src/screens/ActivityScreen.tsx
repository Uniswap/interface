import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { useAppStackNavigation } from 'src/app/navigation/types'
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
import { useActiveAccountWithThrow, useNativeAccountExists } from 'src/features/wallet/hooks'
import { removePendingSession } from 'src/features/walletConnect/walletConnectSlice'
import { OnboardingScreens, Screens } from 'src/screens/Screens'

export function ActivityScreen() {
  const dispatch = useAppDispatch()
  const navigation = useAppStackNavigation()
  const { t } = useTranslation()
  const { address, type } = useActiveAccountWithThrow()
  const readonly = type === AccountType.Readonly
  const hasImportedSeedPhrase = useNativeAccountExists()

  // TODO: [MOB-3918] remove when buy flow ready
  const onPressScan = () => {
    // in case we received a pending session from a previous scan after closing modal
    dispatch(removePendingSession())
    dispatch(
      openModal({ name: ModalName.WalletConnectScan, initialState: ScannerModalState.WalletQr })
    )
  }

  const onPressImport = () => {
    navigation.navigate(Screens.OnboardingStack, {
      screen: OnboardingScreens.ImportMethod,
    })
  }

  useEffect(() => {
    dispatch(setNotificationStatus({ address, hasNotifications: false }))
  }, [dispatch, address])

  const emptyStateDescription = readonly
    ? t('Import this wallet’s recovery phrase to make transactions.')
    : t('When you approve, trade, or transfer tokens or NFTs, your transactions will appear here.')

  const emptyStateButtonLabel =
    readonly && !hasImportedSeedPhrase ? t('Import recovery phrase') : t('Receive tokens or NFTs')

  return (
    <Screen edges={['top', 'left', 'right']}>
      <BackHeader p="md">
        <Text variant="buttonLabelMedium">{t('Activity')}</Text>
      </BackHeader>
      <Flex fill px="md">
        <TransactionList
          emptyStateContent={
            <Flex centered grow height="100%">
              <BaseCard.EmptyState
                buttonLabel={emptyStateButtonLabel}
                description={emptyStateDescription}
                icon={<NoTransactions />}
                title={t('No activity yet')}
                onPress={readonly && !hasImportedSeedPhrase ? onPressImport : onPressScan}
              />
            </Flex>
          }
          ownerAddress={address}
          readonly={readonly}
        />
      </Flex>
    </Screen>
  )
}
