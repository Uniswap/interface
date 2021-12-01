import React from 'react'
import TripleDots from 'src/assets/icons/triple-dots.svg'
import { Identicon } from 'src/components/accounts/Identicon'
import { Button } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout/Box'
import { CenterBox } from 'src/components/layout/CenterBox'
import { Text } from 'src/components/Text'
import { AccountStub } from 'src/features/wallet/accounts/types'
import { shortenAddress } from 'src/utils/addresses'

interface Props {
  account: AccountStub
  isActive?: boolean
  isEditable?: boolean
  onPress?: (address: Address) => void
  onEdit?: (address: Address) => void
}

export function AccountCard({
  account: { address, name },
  isActive,
  isEditable,
  onPress,
  onEdit,
}: Props) {
  return (
    <Button onPress={onPress ? () => onPress(address) : undefined} width="100%" mb="md">
      <Box
        width="100%"
        flexDirection="row"
        p="md"
        alignItems="center"
        justifyContent="space-between"
        backgroundColor="white"
        borderColor={isActive ? 'primary1' : 'white'}
        borderRadius="lg"
        borderWidth={1}
        testID={`account_item/${address.toLowerCase()}`}>
        <CenterBox flexDirection="row">
          <Identicon address={address} size={50} mr="md" />
          <Box>
            <Text variant="h3">$2,243.22</Text>
            <Text variant="body">{name || shortenAddress(address)}</Text>
          </Box>
        </CenterBox>
        {isEditable && onEdit && (
          <Button onPress={() => onEdit(address)} mr="sm">
            <TripleDots width={26} height={16} />
          </Button>
        )}
      </Box>
    </Button>
  )
}
