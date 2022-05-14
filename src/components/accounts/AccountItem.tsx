import { useTheme } from '@shopify/restyle'
import React from 'react'
import TripleDots from 'src/assets/icons/triple-dots.svg'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Button } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout/Box'
import { ElementName, SectionName } from 'src/features/telemetry/constants'
import { Trace } from 'src/features/telemetry/Trace'
import { Account } from 'src/features/wallet/accounts/types'
import { Theme } from 'src/styles/theme'

interface Props {
  account: Account
  isActive?: boolean
  onPress?: (address: Address) => void
  onEdit?: (address: Address) => void
}

export function AccountItem({ account, isActive, onPress, onEdit }: Props) {
  const theme = useTheme<Theme>()

  const { address } = account

  return (
    <Trace section={SectionName.AccountCard}>
      <Button
        name={ElementName.AccountCard}
        width="100%"
        onPress={onPress ? () => onPress(address) : undefined}>
        <Box
          alignItems="center"
          backgroundColor={isActive ? 'deprecated_gray50' : 'none'}
          borderRadius="lg"
          flexDirection="row"
          justifyContent="space-between"
          padding="sm"
          testID={`account_item/${address.toLowerCase()}`}
          width="100%">
          <AddressDisplay alwaysShowAddress address={address} size={50} variant="bodyMd" />
          {onEdit && (
            <Button mx="sm" my="md" name={ElementName.Edit} onPress={() => onEdit(address)}>
              <TripleDots
                height={12}
                stroke={theme.colors.deprecated_textColor}
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
