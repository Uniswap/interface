import React from 'react'
import Check from 'src/assets/icons/check.svg'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Button } from 'src/components/buttons/Button'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { formatUSDPrice } from 'src/utils/format'

interface Props {
  address: string
  selected: boolean
  balance: number
  onSelect: (address: string) => void
  name?: string
  testID?: string
}

export default function WalletPreviewCard({
  address,
  selected,
  balance,
  onSelect,
  ...rest
}: Props) {
  return (
    <Button
      backgroundColor={selected ? 'backgroundAction' : 'backgroundSurface'}
      borderColor={selected ? 'accentActive' : 'none'}
      borderRadius="lg"
      borderWidth={1}
      p="md"
      onPress={() => onSelect(address)}
      {...rest}>
      <Flex row alignItems="center" justifyContent="space-between">
        <Flex row justifyContent="flex-start">
          {selected && <Check height={24} width={24} />}
          {/* TODO(MOB-1994): show ENS name AND truncated Ethereum address */}
          <AddressDisplay
            address={address}
            horizontalGap="md"
            showUnicon={!selected}
            variant="subheadSmall"
          />
        </Flex>
        <Text color="textSecondary" variant="caption">
          {formatUSDPrice(balance)}
        </Text>
      </Flex>
    </Button>
  )
}
