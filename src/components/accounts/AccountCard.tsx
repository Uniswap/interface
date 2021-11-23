import React from 'react'
import { Identicon } from 'src/components/accounts/Identicon'
import { Button } from 'src/components/buttons/Button'
import { DashCircle } from 'src/components/icons/DashCircle'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { AccountStub } from 'src/features/wallet/accounts/types'
import { shortenAddress } from 'src/utils/addresses'

interface Props {
  account: AccountStub
  isActive?: boolean
  isEditable?: boolean
  onRemove?: (address: Address) => void
}

export function AccountCard({ account: { address, name }, isActive, isEditable, onRemove }: Props) {
  return (
    <Box
      flexDirection="row"
      alignItems="center"
      p="md"
      mb="md"
      backgroundColor="white"
      borderColor={isActive ? 'primary1' : 'white'}
      borderRadius="lg"
      borderWidth={1}
      testID={`account_item/${address.toLowerCase()}`}>
      {isEditable && onRemove && (
        <Button onPress={() => onRemove(address)} mr="sm">
          <DashCircle backgroundColor="red" size={24} />
        </Button>
      )}
      <Identicon address={address} size={50} mr="md" />
      <Box>
        <Text variant="h3">$2,243.22</Text>
        <Text variant="body">{name || shortenAddress(address)}</Text>
      </Box>
    </Box>
  )
}
