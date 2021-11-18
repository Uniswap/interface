import React from 'react'
import { useTranslation } from 'react-i18next'
import { WebView } from 'react-native-webview'
import { BackButton } from 'src/components/buttons/BackButton'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { shortenAddress } from 'src/utils/addresses'

interface NotificationsHeaderProps {
  address: Address
}

function NotificationsHeader({ address }: NotificationsHeaderProps) {
  return (
    <Box my="md" alignItems="center" justifyContent="space-between" flexDirection="row">
      <BackButton ml="lg" size={30} />
      <Box alignItems="center" flexDirection="row">
        <Text variant="h3" ml="sm">
          {shortenAddress(address)}
        </Text>
      </Box>
      <Box width={40} height={40} mr="lg" />
    </Box>
  )
}

export function NotificationsScreen() {
  const activeAccount = useActiveAccount()
  const { t } = useTranslation()

  if (!activeAccount || !activeAccount.address) {
    return (
      <Screen backgroundColor="blue">
        <Text variant="h1">{t`Connect Wallet`}</Text>
      </Screen>
    )
  }

  return (
    <Screen backgroundColor="red">
      <NotificationsHeader address={activeAccount?.address} />
      <WebView source={{ uri: `https://etherscan.io/address/${activeAccount?.address}` }} />
    </Screen>
  )
}
