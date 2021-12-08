import React from 'react'
import { useTranslation } from 'react-i18next'
import { WebView } from 'react-native-webview'
import { BackX } from 'src/components/buttons/BackX'
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
    <Box justifyContent="space-between" flexDirection="row" pb="sm" px="lg">
      <Text variant="h3" ml="sm">
        {shortenAddress(address)}
      </Text>
      <BackX />
    </Box>
  )
}

export function NotificationsScreen() {
  const activeAccount = useActiveAccount()
  const { t } = useTranslation()

  if (!activeAccount || !activeAccount.address) {
    return (
      <Screen>
        <Text variant="h1">{t`Connect Wallet`}</Text>
      </Screen>
    )
  }

  return (
    <Screen>
      <NotificationsHeader address={activeAccount?.address} />
      <WebView source={{ uri: `https://etherscan.io/address/${activeAccount?.address}` }} />
    </Screen>
  )
}
