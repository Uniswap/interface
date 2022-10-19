import { DrawerActions } from '@react-navigation/core'
import { selectionAsync } from 'expo-haptics'
import React, { useCallback } from 'react'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import { useEagerActivityNavigation } from 'src/app/navigation/hooks'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Button } from 'src/components/buttons/Button'
import { Chevron } from 'src/components/icons/Chevron'
import { TxHistoryIconWithStatus } from 'src/components/icons/TxHistoryIconWithStatus'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { openModal } from 'src/features/modals/modalSlice'
import { PendingNotificationBadge } from 'src/features/notifications/PendingNotificationBadge'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { useSortedPendingTransactions } from 'src/features/transactions/hooks'
import { selectActiveAccountAddress } from 'src/features/wallet/selectors'

export function AccountHeader() {
  const theme = useAppTheme()
  const navigation = useAppStackNavigation()
  const activeAddress = useAppSelector(selectActiveAccountAddress)
  const dispatch = useAppDispatch()

  const { preload, navigate } = useEagerActivityNavigation()

  const sortedPendingTransactions = useSortedPendingTransactions(activeAddress)

  const onPressAccountHeader = useCallback(() => {
    navigation.dispatch(DrawerActions.openDrawer())
  }, [navigation])

  const onPressNotifications = useCallback(() => {
    if (activeAddress) {
      navigate(activeAddress)
    }
  }, [activeAddress, navigate])

  const onPressInNotifications = useCallback(() => {
    if (activeAddress) {
      preload(activeAddress)
    }
  }, [activeAddress, preload])

  return (
    <Box
      alignItems="center"
      flexDirection="row"
      justifyContent="space-between"
      mx="lg"
      my="sm"
      testID="account-header">
      <Button
        alignItems="center"
        flex={1}
        flexDirection="row"
        name={ElementName.Manage}
        testID={ElementName.Manage}
        onLongPress={() => {
          selectionAsync()
          dispatch(openModal({ name: ModalName.Experiments }))
        }}
        onPress={onPressAccountHeader}>
        {activeAddress && (
          <Flex row gap="xs">
            <AddressDisplay address={activeAddress} variant="mediumLabel" />
            <Chevron color={theme.colors.textSecondary} direction="s" height={20} width={20} />
          </Flex>
        )}
      </Button>
      <Box alignItems="center" flexDirection="row" justifyContent="flex-end">
        <Button onPress={onPressNotifications} onPressIn={onPressInNotifications}>
          {sortedPendingTransactions?.length ? (
            <PendingNotificationBadge sortedPendingTransactions={sortedPendingTransactions} />
          ) : (
            <TxHistoryIconWithStatus />
          )}
        </Button>
      </Box>
    </Box>
  )
}
