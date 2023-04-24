import React from 'react'
import Check from 'src/assets/icons/check.svg'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { ElementName } from 'src/features/telemetry/constants'
import { formatUSDPrice, NumberType } from 'src/utils/format'

interface Props {
  address: string
  selected: boolean
  balance?: number | null
  onSelect: (address: string) => void
  name?: ElementName
  testID?: string
}

export const ADDRESS_WRAPPER_HEIGHT = 36
const UNICON_SIZE = 32
const CHECK_ICON_SIZE = 24

export default function WalletPreviewCard({
  address,
  selected,
  balance,
  onSelect,
  ...rest
}: Props): JSX.Element {
  return (
    <TouchableArea
      backgroundColor={selected ? 'background3' : 'background1'}
      borderColor={selected ? 'accentActive' : 'none'}
      borderRadius="rounded16"
      borderWidth={1}
      px="spacing16"
      py="spacing12"
      onPress={(): void => onSelect(address)}
      {...rest}>
      <Flex row alignItems="center" justifyContent="space-between">
        <Flex
          row
          alignItems="center"
          gap="spacing12"
          height={ADDRESS_WRAPPER_HEIGHT}
          justifyContent="flex-start">
          {selected && (
            <Flex centered height={UNICON_SIZE} width={UNICON_SIZE}>
              <Check height={CHECK_ICON_SIZE} width={CHECK_ICON_SIZE} />
            </Flex>
          )}
          <AddressDisplay
            address={address}
            showAccountIcon={!selected}
            size={UNICON_SIZE}
            textAlign="flex-start"
            variant="bodyLarge"
          />
        </Flex>
        {balance ? (
          <Text color="textSecondary" variant="subheadSmall">
            {formatUSDPrice(balance, NumberType.FiatTokenQuantity)}
          </Text>
        ) : null}
      </Flex>
    </TouchableArea>
  )
}
