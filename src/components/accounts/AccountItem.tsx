import { useTheme } from '@shopify/restyle'
import React from 'react'
import TripleDots from 'src/assets/icons/triple-dots.svg'
import { Identicon } from 'src/components/accounts/Identicon'
import { useAccountDisplayName } from 'src/components/accounts/useAccountDisplayName'
import { Button } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout/Box'
import { CenterBox } from 'src/components/layout/CenterBox'
import { Text } from 'src/components/Text'
import { ElementName, SectionName } from 'src/features/telemetry/constants'
import { Trace } from 'src/features/telemetry/Trace'
import { Account } from 'src/features/wallet/accounts/types'
import { Theme } from 'src/styles/theme'
import { shortenAddress } from 'src/utils/addresses'

interface Props {
  account: Account
  isActive?: boolean
  onPress?: (address: Address) => void
  onEdit?: (address: Address) => void
}

export function AccountItem({ account, isActive, onPress, onEdit }: Props) {
  const theme = useTheme<Theme>()

  const { address } = account
  const displayName = useAccountDisplayName(account)

  return (
    <Trace section={SectionName.AccountCard}>
      <Button
        name={ElementName.AccountCard}
        width="100%"
        onPress={onPress ? () => onPress(address) : undefined}>
        <Box
          alignItems="center"
          backgroundColor={isActive ? 'gray50' : 'none'}
          borderRadius="lg"
          flexDirection="row"
          justifyContent="space-between"
          padding="sm"
          testID={`account_item/${address.toLowerCase()}`}
          width="100%">
          <CenterBox flexDirection="row">
            <Identicon address={address} mr="md" size={50} />
            <Box>
              <Text fontWeight="500" variant="body">
                {displayName}
              </Text>
              {/* TODO get real total */}
              <Text color="gray600" mt="xs" variant="bodySm">
                {shortenAddress(address)}
              </Text>
            </Box>
          </CenterBox>
          {onEdit && (
            <Button mx="sm" my="md" name={ElementName.Edit} onPress={() => onEdit(address)}>
              <TripleDots
                height={12}
                stroke={theme.colors.textColor}
                strokeLinecap="round"
                strokeWidth="2"
                width={22}
              />
            </Button>
          )}
        </Box>
      </Button>
    </Trace>
  )
}
