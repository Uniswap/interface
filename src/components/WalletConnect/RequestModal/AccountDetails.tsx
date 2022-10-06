import React from 'react'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { Unicon } from 'src/components/unicons/Unicon'
import { useDisplayName } from 'src/features/wallet/hooks'
import { shortenAddress } from 'src/utils/addresses'

export function AccountDetails({ address, iconSize = 20 }: { address: string; iconSize?: number }) {
  const displayName = useDisplayName(address)

  return (
    <Flex centered row>
      <Flex grow row alignItems="center" gap="xs">
        <Unicon address={address} size={iconSize} />
        <Text variant="subheadSmall">{displayName?.name}</Text>
      </Flex>
      <Text color="textSecondary" variant="bodySmall">
        {shortenAddress(address)}
      </Text>
    </Flex>
  )
}
