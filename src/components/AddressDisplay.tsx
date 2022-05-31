import React from 'react'
import { Identicon } from 'src/components/accounts/Identicon'
import { IdenticonWithNotificationBadge } from 'src/components/accounts/IdenticonWithNotificationBadge'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { useDisplayName } from 'src/features/wallet/hooks'
import { Theme } from 'src/styles/theme'
import { shortenAddress } from 'src/utils/addresses'

type AddressDisplayProps = {
  address: string
  showAddressAsSubtitle?: boolean
  displayName?: string
  size?: number
  variant?: keyof Theme['textVariants']
  verticalGap?: keyof Theme['spacing']
  showNotificationBadge?: boolean
}

/** Helper component to display identicon and formatted address */
export function AddressDisplay({
  address,
  size = 24,
  variant = 'body1',
  verticalGap = 'xxs',
  showAddressAsSubtitle,
  showNotificationBadge,
}: AddressDisplayProps) {
  const displayName = useDisplayName(address)
  const nameTypeIsAddress = displayName?.type === 'address'

  return (
    <Flex row alignItems="center" gap="sm">
      {showNotificationBadge ? (
        <IdenticonWithNotificationBadge address={address} size={size} />
      ) : (
        <Identicon address={address} size={size} />
      )}
      <Flex gap={verticalGap}>
        <Text
          color="deprecated_textColor"
          testID={`address-display/name/${displayName?.name}`}
          variant={variant}>
          {displayName?.name}
        </Text>
        {showAddressAsSubtitle && !nameTypeIsAddress && (
          <Text color="deprecated_gray600" variant="caption">
            {shortenAddress(address)}
          </Text>
        )}
      </Flex>
    </Flex>
  )
}
