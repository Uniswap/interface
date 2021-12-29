import React from 'react'
import TripleDots from 'src/assets/icons/triple-dots.svg'
import { Identicon } from 'src/components/accounts/Identicon'
import { Button } from 'src/components/buttons/Button'
import { CheckmarkCircle } from 'src/components/icons/CheckmarkCircle'
import { Box } from 'src/components/layout/Box'
import { CenterBox } from 'src/components/layout/CenterBox'
import { Text } from 'src/components/Text'
import { Account } from 'src/features/wallet/accounts/types'
import { shortenAddress } from 'src/utils/addresses'

interface Props {
  account: Account
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
    <Button onPress={onPress ? () => onPress(address) : undefined} width="100%">
      <Box
        width="100%"
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        backgroundColor="white"
        testID={`account_item/${address.toLowerCase()}`}>
        <CenterBox flexDirection="row">
          <Identicon address={address} size={50} mr="md" />
          <Box>
            <Text variant="body" fontWeight="500">
              {name || shortenAddress(address)}
            </Text>
            {/* TODO get real total */}
            <Text variant="bodySm" color="gray400" mt="xs">
              {shortenAddress(address)}
            </Text>
          </Box>
        </CenterBox>
        {isEditable && onEdit && (
          <Button onPress={() => onEdit(address)} mx="sm" my="md">
            <TripleDots width={22} height={12} />
          </Button>
        )}
        {!isEditable && isActive && <CheckmarkCircle size={30} backgroundColor="green" />}
      </Box>
    </Button>
  )
}
