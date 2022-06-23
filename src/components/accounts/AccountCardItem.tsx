import React from 'react'
import { useColorScheme } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import QrCode from 'src/assets/icons/qr-code.svg'
import TripleDots from 'src/assets/icons/triple-dots.svg'
import { useAddressColor } from 'src/components/accounts/Identicon'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Button } from 'src/components/buttons/Button'
import { Flex } from 'src/components/layout'
import { TotalBalance } from 'src/features/balances/TotalBalance'
import { useActiveChainIds } from 'src/features/chains/utils'
import { useAllBalancesByChainId } from 'src/features/dataApi/balances'
import { ElementName } from 'src/features/telemetry/constants'
import { Account } from 'src/features/wallet/accounts/types'
import { opacify } from 'src/utils/colors'

interface Props {
  account: Account
  isActive?: boolean
  onPress?: (address: Address) => void
  onPressQRCode: (address: Address) => void
  onPressEdit?: (address: Address) => void
}

export function AccountCardItem({ account, isActive, onPress, onPressQRCode, onPressEdit }: Props) {
  const { address } = account
  const isDarkMode = useColorScheme() === 'dark'
  const theme = useAppTheme()

  const color = useAddressColor(address, isDarkMode)

  const currentChains = useActiveChainIds()
  const { balances } = useAllBalancesByChainId(address, currentChains)

  return (
    <Button onPress={onPress ? () => onPress(address) : undefined}>
      <Flex
        borderRadius="lg"
        borderWidth={0.5}
        flexDirection="column"
        gap="xl"
        my="xs"
        p="md"
        // eslint-disable-next-line react-native/no-inline-styles
        style={{
          borderColor: isActive ? color : 'none',
          backgroundColor: opacify(10, color),
        }}
        testID={`account_item/${address.toLowerCase()}`}>
        <Flex row alignItems="center" borderRadius="sm" justifyContent="space-between">
          <AddressDisplay
            showAddressAsSubtitle
            address={address}
            showNotificationBadge={true}
            size={36}
            variant="body1"
            verticalGap="none"
          />
          <Button
            alignItems="center"
            height={20}
            justifyContent="center"
            padding="sm"
            width={20}
            onPress={() => onPressQRCode(address)}>
            <QrCode color={theme.colors.textSecondary} height={20} strokeWidth={1} width={20} />
          </Button>
        </Flex>
        <Flex row alignItems="center" justifyContent="space-between">
          <TotalBalance balances={balances} variant="h3" />
          {onPressEdit && (
            <Button name={ElementName.Edit} onPress={() => onPressEdit(address)}>
              <TripleDots
                color={theme.colors.textTertiary}
                height={12}
                strokeLinecap="round"
                strokeWidth="1"
                width={20}
              />
            </Button>
          )}
        </Flex>
      </Flex>
    </Button>
  )
}
