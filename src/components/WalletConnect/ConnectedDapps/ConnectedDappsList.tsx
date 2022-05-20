import React from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList } from 'react-native'
import 'react-native-reanimated'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import { Button } from 'src/components/buttons/Button'
import { Chevron } from 'src/components/icons/Chevron'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { DappConnectionItem } from 'src/components/WalletConnect/ConnectedDapps/DappConnectionItem'
import { WalletConnectSession } from 'src/features/walletConnect/walletConnectSlice'

type ConnectedDappsProps = {
  sessions: WalletConnectSession[]
  goBack: () => void
  setSelectedSession: (session: WalletConnectSession) => void
  setShowNetworkModal: (show: boolean) => void
}

export function ConnectedDappsList({
  sessions,
  goBack,
  setSelectedSession,
  setShowNetworkModal,
}: ConnectedDappsProps) {
  const theme = useAppTheme()
  const { t } = useTranslation()

  return (
    <AnimatedFlex grow entering={FadeIn} exiting={FadeOut} mt="lg" pt="lg">
      <Flex row alignItems="center" mx="lg">
        <Button onPress={goBack}>
          <Chevron color={theme.colors.neutralTextPrimary} direction="w" height={18} width={18} />
        </Button>
        <Text color="neutralTextPrimary" variant="largeLabel">
          {t('Manage connections')}
        </Text>
      </Flex>
      <FlatList
        ListEmptyComponent={
          <Flex centered mt="lg">
            <Text color="neutralTextSecondary" variant="body1">
              {t('No connected dApps')}
            </Text>
          </Flex>
        }
        columnWrapperStyle={{ marginHorizontal: theme.spacing.sm }}
        data={sessions}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={(item) => (
          <DappConnectionItem
            wrapped={item}
            onPressChangeNetwork={() => {
              setSelectedSession(item.item)
              setShowNetworkModal(true)
            }}
          />
        )}
      />
    </AnimatedFlex>
  )
}
