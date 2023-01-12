import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Chevron } from 'src/components/icons/Chevron'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { shortenAddress } from 'src/utils/addresses'

export function AccountDetails({
  address,
  iconSize = 20,
  chevron = false,
}: {
  address: string
  iconSize?: number
  chevron?: boolean
}) {
  const theme = useAppTheme()

  return (
    <Flex row shrink alignItems="center" justifyContent="space-between">
      <Flex row shrink flex={1}>
        <AddressDisplay
          hideAddressInSubtitle
          address={address}
          size={iconSize}
          variant="subheadSmall"
        />
      </Flex>
      <Flex row shrink flex={1} gap="xxs" justifyContent="flex-end">
        <Text color="textSecondary" variant="bodySmall">
          {shortenAddress(address)}
        </Text>
        {chevron && (
          <Chevron
            color={theme.colors.textSecondary}
            direction="e"
            height={iconSize}
            width={iconSize}
          />
        )}
      </Flex>
    </Flex>
  )
}
