import { ImpactFeedbackStyle, selectionAsync } from 'expo-haptics'
import React, { useCallback } from 'react'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import { useEagerActivityNavigation } from 'src/app/navigation/hooks'
import DoubleChevron from 'src/assets/icons/double-chevron.svg'
import ScanQRWCIcon from 'src/assets/icons/scan-qr-wc.svg'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { TxHistoryIconWithStatus } from 'src/components/icons/TxHistoryIconWithStatus'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { openModal } from 'src/features/modals/modalSlice'
import { PendingNotificationBadge } from 'src/features/notifications/PendingNotificationBadge'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { useSortedPendingTransactions } from 'src/features/transactions/hooks'
import { selectActiveAccountAddress } from 'src/features/wallet/selectors'
import { removePendingSession } from 'src/features/walletConnect/walletConnectSlice'
import { iconSizes } from 'src/styles/sizing'
import { isDevBuild } from 'src/utils/version'

function QRScannerIconButton({ onPress }: { onPress: () => void }): JSX.Element {
  const theme = useAppTheme()

  return (
    <TouchableArea hapticFeedback name={ElementName.WalletConnectScan} onPress={onPress}>
      <ScanQRWCIcon
        color={theme.colors.textSecondary}
        height={theme.iconSizes.lg}
        strokeWidth={2}
      />
    </TouchableArea>
  )
}

export function AccountHeader(): JSX.Element {
  const theme = useAppTheme()
  const activeAddress = useAppSelector(selectActiveAccountAddress)
  const dispatch = useAppDispatch()

  const { preload, navigate } = useEagerActivityNavigation()

  const sortedPendingTransactions = useSortedPendingTransactions(activeAddress)

  const onPressAccountHeader = useCallback(() => {
    dispatch(openModal({ name: ModalName.AccountSwitcher }))
  }, [dispatch])

  const onPressNotifications = useCallback(() => {
    if (activeAddress) {
      navigate()
    }
  }, [activeAddress, navigate])

  const onPressInNotifications = useCallback(() => {
    if (activeAddress) {
      preload(activeAddress)
    }
  }, [activeAddress, preload])

  const onPressScan = useCallback(() => {
    // in case we received a pending session from a previous scan after closing modal
    dispatch(removePendingSession())
    dispatch(
      openModal({ name: ModalName.WalletConnectScan, initialState: ScannerModalState.ScanQr })
    )
  }, [dispatch])

  return (
    <Box
      alignItems="center"
      flexDirection="row"
      justifyContent="space-between"
      mt="md"
      testID="account-header">
      <TouchableArea
        hapticFeedback
        alignItems="center"
        flex={1}
        flexDirection="row"
        hapticStyle={ImpactFeedbackStyle.Medium}
        mr="sm"
        name={ElementName.Manage}
        testID={ElementName.Manage}
        onLongPress={(): void => {
          if (isDevBuild()) {
            selectionAsync()
            dispatch(openModal({ name: ModalName.Experiments }))
          }
        }}
        onPress={onPressAccountHeader}>
        {activeAddress && (
          <Flex row alignItems="center" gap="xxs">
            <Flex shrink>
              <AddressDisplay
                hideAddressInSubtitle
                address={activeAddress}
                horizontalGap="xs"
                size={iconSizes.xl}
                variant="subheadLarge"
              />
            </Flex>
            <DoubleChevron
              color={theme.colors.textSecondary}
              height={iconSizes.sm}
              width={iconSizes.sm}
            />
          </Flex>
        )}
      </TouchableArea>
      <Flex alignItems="center" flexDirection="row" gap="md" justifyContent="flex-end">
        <QRScannerIconButton onPress={onPressScan} />
        <TouchableArea onPress={onPressNotifications} onPressIn={onPressInNotifications}>
          {sortedPendingTransactions?.length ? (
            <PendingNotificationBadge sortedPendingTransactions={sortedPendingTransactions} />
          ) : (
            <TxHistoryIconWithStatus />
          )}
        </TouchableArea>
      </Flex>
    </Box>
  )
}
