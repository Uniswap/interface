import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import ProfileIcon from 'src/assets/icons/profile.svg'
import { Button } from 'src/components/buttons/Button'
import { Flex } from 'src/components/layout/Flex'
import { Text } from 'src/components/Text'
import { Unicon } from 'src/components/unicons/Unicon'
import { shortenAddress } from 'src/utils/addresses'

export type WalletItemProps = {
  address: Address
  ensName?: string
  onPress?: () => void
}

export function WalletItem({ address, ensName, onPress }: WalletItemProps) {
  const theme = useAppTheme()
  return (
    <Button testID={`wallet-item-${address}`} onPress={onPress}>
      <Flex row alignItems="center" gap="sm" justifyContent="space-between" px="xs" py="sm">
        <Flex centered row gap="sm">
          <Unicon address={address} size={35} />
          <Flex gap="xxs">
            <Text variant="mediumLabel">{ensName}</Text>
            <Text color="textSecondary" variant="caption">
              {shortenAddress(address)}
            </Text>
          </Flex>
        </Flex>
        <ProfileIcon color={theme.colors.textSecondary} height={24} width={24} />
      </Flex>
    </Button>
  )
}
