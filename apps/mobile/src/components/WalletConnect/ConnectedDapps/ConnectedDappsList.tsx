import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, StyleSheet, ViewStyle } from 'react-native'
import 'react-native-reanimated'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import { BackButton } from 'src/components/buttons/BackButton'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { AnimatedFlex, Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { DappConnectedNetworkModal } from 'src/components/WalletConnect/ConnectedDapps/DappConnectedNetworksModal'
import { DappConnectionItem } from 'src/components/WalletConnect/ConnectedDapps/DappConnectionItem'
import { DappSwitchNetworkModal } from 'src/components/WalletConnect/ConnectedDapps/DappSwitchNetworkModal'
import { WalletConnectSession } from 'src/features/walletConnect/walletConnectSlice'
import { dimensions } from 'ui/src/theme/restyle'

type ConnectedDappsProps = {
  sessions: WalletConnectSession[]
  backButton?: JSX.Element
}

export function ConnectedDappsList({ backButton, sessions }: ConnectedDappsProps): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const [isEditing, setIsEditing] = useState(false)
  const [selectedSession, setSelectedSession] = useState<WalletConnectSession>()

  return (
    <>
      <AnimatedFlex fill entering={FadeIn} exiting={FadeOut} pt="spacing12">
        <Flex row alignItems="center" justifyContent="space-between" px="spacing24">
          <Box width={theme.iconSizes.icon40}>{backButton ?? <BackButton />}</Box>
          <Text color="neutral1" variant="bodyLarge">
            {t('Manage connections')}
          </Text>
          <TouchableArea
            width={theme.iconSizes.icon40}
            onPress={(): void => {
              setIsEditing(!isEditing)
            }}>
            <Text
              color={isEditing ? 'accent1' : 'neutral3'}
              textAlign="right"
              variant="subheadSmall">
              {isEditing ? t('Done') : t('Edit')}
            </Text>
          </TouchableArea>
        </Flex>

        {sessions.length > 0 ? (
          <FlatList
            columnWrapperStyle={ColumnStyle.base}
            contentContainerStyle={{ paddingHorizontal: theme.spacing.spacing24 }}
            data={sessions}
            keyExtractor={(item): string => item.id}
            numColumns={2}
            renderItem={({ item }): JSX.Element => (
              <DappConnectionItem
                isEditing={isEditing}
                session={item}
                onPressChangeNetwork={(session): void => setSelectedSession(session)}
              />
            )}
          />
        ) : (
          <Flex fill alignItems="center" gap="spacing8" px="spacing24" style={emptyCardStyle}>
            <Text color="neutral1" variant="subheadLarge">
              {t('No apps connected')}
            </Text>
            <Text color="neutral2" textAlign="center" variant="bodySmall">
              {t('Connect to an app by scanning a code via WalletConnect')}
            </Text>
          </Flex>
        )}
      </AnimatedFlex>
      {selectedSession &&
        (selectedSession.version === '1' ? (
          <DappSwitchNetworkModal
            selectedSession={selectedSession}
            onClose={(): void => setSelectedSession(undefined)}
          />
        ) : (
          <DappConnectedNetworkModal
            session={selectedSession}
            onClose={(): void => setSelectedSession(undefined)}
          />
        ))}
    </>
  )
}

const ColumnStyle = StyleSheet.create({
  base: {
    justifyContent: 'space-between',
  },
})
const emptyCardStyle: ViewStyle = {
  paddingTop: dimensions.fullHeight / 5,
}
