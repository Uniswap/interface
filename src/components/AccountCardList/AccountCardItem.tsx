import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ViewStyle } from 'react-native'
import CopySheets from 'src/assets/icons/copy-sheets.svg'
import QrCode from 'src/assets/icons/qr-code.svg'
import Send from 'src/assets/icons/send.svg'
import { useAddressColor } from 'src/components/accounts/Identicon'
import { Button } from 'src/components/buttons/Button'
import { CopyTextButton } from 'src/components/buttons/CopyTextButton'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { TotalBalance } from 'src/features/balances/TotalBalance'
import { Account } from 'src/features/wallet/accounts/types'
import { dimensions } from 'src/styles/sizing'
import { shortenAddress } from 'src/utils/addresses'
import { opacify } from 'src/utils/colors'

interface Props {
  account: Account
  balances: CurrencyAmount<Currency>[]
  isActive?: boolean
  onPress?: (address: Address) => void
  onPressQRCode: () => void
  onPressSend: () => void
}

export function AccountCardItem({
  account: { address },
  balances,
  onPress,
  onPressQRCode,
  onPressSend,
}: Props) {
  const { t } = useTranslation()
  const color = useAddressColor(address)

  return (
    <Button
      p="md"
      width={dimensions.fullWidth}
      onPress={onPress ? () => onPress(address) : undefined}>
      <Box
        borderRadius="lg"
        flexDirection="column"
        testID={`account_item/${address.toLowerCase()}`}>
        <Flex borderRadius="lg" gap="lg" p="lg" style={accountCardStyle}>
          <Box flexDirection="row" justifyContent="space-between">
            <Flex
              alignItems="center"
              bg="white"
              borderRadius="sm"
              flexDirection="row"
              px="sm"
              py="xxs">
              <Text fontWeight="600" variant="bodySm">
                {t('Wallet')}
              </Text>
            </Flex>
            <CopyTextButton copyText={address}>
              <Flex alignItems="center" flexDirection="row" gap="sm">
                <Text color="gray400" variant="body">
                  {shortenAddress(address)}
                </Text>
                <CopySheets height={18} stroke="gray400" width={18} />
              </Flex>
            </CopyTextButton>
          </Box>
          <Box mb="sm">
            <TotalBalance balances={balances} />
          </Box>
        </Flex>
      </Box>
      <Flex flexDirection="row" gap="sm" justifyContent="flex-end" px="lg">
        <Button
          alignItems="center"
          bg="white"
          height={50}
          justifyContent="center"
          padding="sm"
          style={{ ...headerButtonStyle, borderColor: opacify(15, color), shadowColor: color }}
          width={50}
          onPress={onPressQRCode}>
          <QrCode height={20} stroke={color} width={20} />
        </Button>
        <Button
          alignItems="center"
          bg="white"
          height={50}
          justifyContent="center"
          padding="sm"
          style={{ ...headerButtonStyle, borderColor: opacify(15, color), shadowColor: color }}
          width={50}
          onPress={onPressSend}>
          <Send height={20} stroke={color} strokeWidth={2.5} width={20} />
        </Button>
      </Flex>
    </Button>
  )
}

// TODO: Finalize background colors of account cards
const accountCardStyle: ViewStyle = {
  backgroundColor: opacify(15, '#2172E5'),
}

const headerButtonStyle: ViewStyle = {
  borderRadius: 15,
  borderWidth: 1,
  marginTop: -25,
  shadowOffset: {
    width: 0,
    height: 0,
  },
  shadowOpacity: 0.2,
  shadowRadius: 5,
}
