import React from 'react'
import { useTranslation } from 'react-i18next'
import { WebView } from 'react-native-webview'
import { CenterBox } from 'src/components/layout/CenterBox'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { shortenAddress } from 'src/utils/addresses'

interface NotificationsHeaderProps {
  address: Address
}

function NotificationsHeader({ address }: NotificationsHeaderProps) {
  return (
    <CenterBox alignItems="center" flexDirection="row" my="sm">
      <Text variant="h3" ml="sm">
        {shortenAddress(address)}
      </Text>
    </CenterBox>
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
