import { DrawerActions } from '@react-navigation/core'
import React, { useCallback } from 'react'
import { useAppSelector, useAppTheme } from 'src/app/hooks'
import { useAppStackNavigation } from 'src/app/navigation/types'
import NotificationIcon from 'src/assets/icons/bell.svg'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Button } from 'src/components/buttons/Button'
import { Chevron } from 'src/components/icons/Chevron'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { PendingNotificationBadge } from 'src/features/notifications/PendingNotificationBadge'
import { ElementName } from 'src/features/telemetry/constants'
import { usePendingTransactions } from 'src/features/transactions/hooks'
import { TransactionDetails } from 'src/features/transactions/types'
import { selectActiveAccountAddress } from 'src/features/wallet/selectors'
import { Screens } from 'src/screens/Screens'

export function AccountHeader() {
  const theme = useAppTheme()
  const navigation = useAppStackNavigation()
  const activeAddress = useAppSelector(selectActiveAccountAddress)

  const pendingTransactions: TransactionDetails[] | undefined =
    usePendingTransactions(activeAddress) ?? []
  const hasPendingTransactions = pendingTransactions?.length > 0

  const onPressAccountHeader = useCallback(() => {
    navigation.dispatch(DrawerActions.openDrawer())
  }, [navigation])

  const onPressNotifications = useCallback(() => {
    navigation.navigate(Screens.Profile)
  }, [navigation])

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
        flexDirection="row"
        name={ElementName.Manage}
        testID={ElementName.Manage}
        onPress={onPressAccountHeader}>
        {activeAddress && (
          <Flex row gap="xs">
            <AddressDisplay address={activeAddress} variant="mediumLabel" />
            <Chevron color={theme.colors.textSecondary} direction="s" height={20} width={20} />
          </Flex>
        )}
      </Button>
      <Box alignItems="center" flexDirection="row" justifyContent="flex-end">
        <Button onPress={onPressNotifications}>
          {hasPendingTransactions ? (
            <PendingNotificationBadge />
          ) : (
            <NotificationIcon color={theme.colors.textSecondary} height={24} width={24} />
          )}
        </Button>
      </Box>
    </Box>
  )
}
