import React from 'react'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { Unicon } from 'src/components/unicons/Unicon'
import { useDisplayName } from 'src/features/wallet/hooks'
import { shortenAddress } from 'src/utils/addresses'

export function AccountDetails({ address, iconSize = 20 }: { address: string; iconSize?: number }) {
  const displayName = useDisplayName(address)

  return (
    <Flex row>
      <Flex grow row alignItems="center" gap="xs">
        <Unicon address={address} size={iconSize} />
        <Text fontWeight="500" variant="subheadSmall">
          {displayName?.name}
        </Text>
      </Flex>
      {displayName?.type !== 'address' && (
        <Text color="textSecondary" variant="bodySmall">
          {shortenAddress(address)}
        </Text>
      )}
    </Flex>
  )
}
