import React from 'react'
import { useTranslation } from 'react-i18next'
import { WebView } from 'react-native-webview'
import { BackX } from 'src/components/buttons/BackX'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { useActiveAccount } from 'src/features/wallet/hooks'

interface NotificationScreenProps {
  onPressClose: () => void
}

export function NotificationsScreen({ onPressClose }: NotificationScreenProps) {
  const activeAccount = useActiveAccount()
  const { t } = useTranslation()

  return (
    <Box flex={1}>
      <Box
        justifyContent="space-between"
        alignItems="center"
        flexDirection="row"
        pt="sm"
        pb="md"
        px="lg">
        {activeAccount?.address && (
          <Text variant="h4" color="gray400">
            {t('Recent Transactions')}
          </Text>
        )}
        <BackX onPressBack={onPressClose} />
      </Box>
      <WebView source={{ uri: `https://etherscan.io/address/${activeAccount?.address}` }} />
    </Box>
  )
}
