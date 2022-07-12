import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList } from 'react-native'
import 'react-native-reanimated'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Text } from 'src/components/Text'
import { DappConnectionItem } from 'src/components/WalletConnect/ConnectedDapps/DappConnectionItem'
import { DappSwitchNetworkModal } from 'src/components/WalletConnect/ConnectedDapps/DappSwitchNetworkModal'
import { WalletConnectSession } from 'src/features/walletConnect/walletConnectSlice'

type ConnectedDappsProps = {
  sessions: WalletConnectSession[]
  goBack?: () => void //TODO: handle this case for the WC modal
}

export function ConnectedDappsList({ sessions }: ConnectedDappsProps) {
  const theme = useAppTheme()
  const { t } = useTranslation()

  const [selectedSession, setSelectedSession] = useState<WalletConnectSession>()

  return (
    <>
      <AnimatedFlex fill entering={FadeIn} exiting={FadeOut} px="lg" py="lg">
        <BackHeader alignment="left">
          <Text color="textPrimary" variant="subhead">
            {t('Manage connections')}
          </Text>
        </BackHeader>

        {sessions.length > 0 ? (
          <FlatList
            columnWrapperStyle={{ marginHorizontal: theme.spacing.sm }}
            data={sessions}
            keyExtractor={(item) => item.id}
            numColumns={2}
            renderItem={(item) => (
              <DappConnectionItem
                wrapped={item}
                onPressChangeNetwork={() => {
                  setSelectedSession(item.item)
                }}
              />
            )}
          />
        ) : (
          <Flex centered fill gap="xs" mx="xl">
            <Text color="textPrimary" variant="body">
              {t('No sites connected')}
            </Text>
            <Text color="textSecondary" textAlign="center" variant="bodySmall">
              {t('Connect to a site by scanning a code via WalletConnect')}
            </Text>
          </Flex>
        )}
      </AnimatedFlex>
      {selectedSession && (
        <DappSwitchNetworkModal
          selectedSession={selectedSession}
          onClose={() => setSelectedSession(undefined)}
        />
      )}
    </>
  )
}
