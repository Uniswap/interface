import React, { useMemo } from 'react'
import { useAppTheme } from 'src/app/hooks'
import TripleDots from 'src/assets/icons/triple-dots.svg'
import { Button } from 'src/components/buttons/Button'
import { Flex } from 'src/components/layout'
import { NotificationBadge } from 'src/components/notifications/Badge'
import { Text } from 'src/components/Text'
import { AvatarWithVisibilityBadge } from 'src/components/unicons/AvatarWithVisibilityBadge'
import { UniconWithVisibilityBadge } from 'src/components/unicons/UniconWithVisibilityBadge'
import { TotalBalance } from 'src/features/balances/TotalBalanceDeprecated'
import { useENSAvatar } from 'src/features/ens/api'
import { useSelectAddressNotificationCount } from 'src/features/notifications/hooks'
import { ElementName } from 'src/features/telemetry/constants'
import { Account } from 'src/features/wallet/accounts/types'
import { useDisplayName } from 'src/features/wallet/hooks'

interface Props {
  account: Account
  isActive?: boolean
  isViewOnly: boolean
  onPress?: (address: Address) => void
  onPressEdit?: (address: Address) => void
}

export function AccountCardItem({ account, onPress, onPressEdit }: Props) {
  const { address } = account
  const theme = useAppTheme()
  const displayName = useDisplayName(address)
  const { data: avatar } = useENSAvatar(address)
  const notificationCount = useSelectAddressNotificationCount(address)

  // Use ENS avatar if found, if not revert to Unicon
  const icon = useMemo(() => {
    if (avatar) {
      return <AvatarWithVisibilityBadge avatarUri={avatar} showViewOnlyBadge={false} size={36} />
    }

    return <UniconWithVisibilityBadge address={address} showViewOnlyBadge={false} size={36} />
  }, [address, avatar])

  return (
    <Button pb="sm" pt="xs" px="lg" onPress={onPress ? () => onPress(address) : undefined}>
      <Flex row alignItems="center" testID={`account_item/${address.toLowerCase()}`}>
        <NotificationBadge backgroundColor="accentAction" notificationCount={notificationCount}>
          {icon}
        </NotificationBadge>
        <Flex grow gap="none">
          <Text variant="subhead">{displayName?.name}</Text>
          <TotalBalance owner={address} variant="caption" />
        </Flex>
        <Flex row alignItems="center" justifyContent="space-between">
          {onPressEdit && (
            <Button name={ElementName.Edit} onPress={() => onPressEdit(address)}>
              <TripleDots
                color={theme.colors.textSecondary}
                height={12}
                strokeLinecap="round"
                strokeWidth="1"
                width={20}
              />
            </Button>
          )}
        </Flex>
      </Flex>
    </Button>
  )
}
