import React from 'react'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { Icons } from 'ui/src'
import { shortenAddress } from 'wallet/src/utils/addresses'

export function AccountDetails({
  address,
  iconSize = 20,
  chevron = false,
}: {
  address: string
  iconSize?: number
  chevron?: boolean
}): JSX.Element {
  return (
    <Flex row shrink alignItems="center" justifyContent="space-between">
      <Flex row shrink flex={1}>
        <AddressDisplay
          hideAddressInSubtitle
          address={address}
          horizontalGap="$spacing8"
          size={iconSize}
          variant="subheadSmall"
        />
      </Flex>
      <Flex row shrink flex={1} gap="spacing4" justifyContent="flex-end">
        <Text color="neutral2" variant="subheadSmall">
          {shortenAddress(address)}
        </Text>
        {chevron && (
          <Icons.RotatableChevron
            color="$neutral2"
            direction="e"
            height={iconSize}
            width={iconSize}
          />
        )}
      </Flex>
    </Flex>
  )
}
