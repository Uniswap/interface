import React, { PropsWithChildren } from 'react'
import { useAppSelector } from 'src/app/hooks'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Button } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout/Box'
import { selectHasUnreadNotifications } from 'src/features/notifications/selectors'
import { ElementName } from 'src/features/telemetry/constants'
import { selectActiveAccountAddress } from 'src/features/wallet/selectors'

type AccountHeaderProps = PropsWithChildren<{
  onPress: () => void
}>

export function AccountHeader({ children, onPress }: AccountHeaderProps) {
  const activeAddress = useAppSelector(selectActiveAccountAddress)
  const hasUnreadNotifications = useAppSelector(selectHasUnreadNotifications)

  return (
    <>
      <NotificationIndicator unreadNotifications={hasUnreadNotifications} />
      <Box
        alignItems="center"
        flexDirection="row"
        justifyContent="space-between"
        testID="account-header">
        <Button
          alignItems="center"
          flexDirection="row"
          name={ElementName.Manage}
          testID={ElementName.Manage}
          onPress={onPress}>
          {activeAddress ? <AddressDisplay address={activeAddress} variant="mediumLabel" /> : null}
        </Button>
        <Box alignItems="center" flexDirection="row" justifyContent="flex-end">
          {children}
        </Box>
      </Box>
    </>
  )
}

function NotificationIndicator({ unreadNotifications }: { unreadNotifications?: boolean }) {
  return (
    <Box
      backgroundColor={unreadNotifications ? 'accentBackgroundAction' : 'neutralTextTertiary'}
      borderRadius="full"
      height={8}
      left={-20} // half of width of dot (4) + left padding of Home Screen (16)
      position="absolute"
      width={8}
    />
  )
}
