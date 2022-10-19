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

const ADDRESS_WRAPPER_HEIGHT = 36
const UNICON_SIZE = 32
const CHECK_ICON_SIZE = 24

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
      px="md"
      py="sm"
      onPress={() => onSelect(address)}
      {...rest}>
      <Flex row alignItems="center" justifyContent="space-between">
        <Flex
          row
          alignItems="center"
          gap="sm"
          height={ADDRESS_WRAPPER_HEIGHT}
          justifyContent="flex-start">
          {selected && (
            <Flex centered height={UNICON_SIZE} width={UNICON_SIZE}>
              <Check height={CHECK_ICON_SIZE} width={CHECK_ICON_SIZE} />
            </Flex>
          )}
          {/* TODO(MOB-1994): show ENS name AND truncated Ethereum address */}
          <AddressDisplay
            showAddressAsSubtitle
            address={address}
            horizontalGap="sm"
            showUnicon={!selected}
            size={UNICON_SIZE}
            textAlign="flex-start"
            variant="subheadSmall"
            verticalGap="none"
          />
        </Flex>
        <Text color="textSecondary" variant="caption_deprecated">
          {formatUSDPrice(balance)}
        </Text>
      </Flex>
    </Button>
  )
}
