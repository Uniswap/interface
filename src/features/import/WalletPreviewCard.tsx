import React from 'react'
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
      backgroundColor={selected ? 'backgroundContainer' : 'backgroundSurface'}
      borderColor={selected ? 'backgroundAction' : 'none'}
      borderRadius="lg"
      borderWidth={1}
      p="md"
      onPress={() => onSelect(address)}
      {...rest}>
      <Flex row alignItems="center" justifyContent="space-between">
        <AddressDisplay address={address} variant="bodySmall" />
        <Text>{formatUSDPrice(balance)}</Text>
      </Flex>
    </Button>
  )
}
