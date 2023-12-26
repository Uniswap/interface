import React from 'react'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Flex, Icons, Text } from 'ui/src'
import { shortenAddress } from 'wallet/src/utils/addresses'

export function AccountDetails({
  address,
  allowFontScaling = true,
  iconSize = 20,
  chevron = false,
}: {
  address: string
  allowFontScaling?: boolean
  iconSize?: number
  chevron?: boolean
}): JSX.Element {
  return (
    <Flex row shrink alignItems="center" gap="$spacing16" justifyContent="space-between">
      <Flex fill row shrink>
        <AddressDisplay
          hideAddressInSubtitle
          address={address}
          allowFontScaling={allowFontScaling}
          horizontalGap="$spacing8"
          size={iconSize}
          variant="body3"
        />
      </Flex>
      <Flex fill row shrink alignItems="center" gap="$spacing4" justifyContent="flex-end">
        <Text allowFontScaling={allowFontScaling} color="$neutral2" variant="body3">
          {shortenAddress(address)}
        </Text>
        {chevron && (
          <Icons.RotatableChevron
            color="$neutral2"
            direction="end"
            height={iconSize}
            width={iconSize}
          />
        )}
      </Flex>
    </Flex>
  )
}
