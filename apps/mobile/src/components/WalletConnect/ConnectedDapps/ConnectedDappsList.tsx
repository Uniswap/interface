import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, StyleSheet, ViewStyle } from 'react-native'
import 'react-native-reanimated'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { BackButton } from 'src/components/buttons/BackButton'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { AnimatedFlex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { DappConnectedNetworkModal } from 'src/components/WalletConnect/ConnectedDapps/DappConnectedNetworksModal'
import { DappConnectionItem } from 'src/components/WalletConnect/ConnectedDapps/DappConnectionItem'
import { WalletConnectSession } from 'src/features/walletConnect/walletConnectSlice'
import { Flex } from 'ui/src'
import { dimensions, iconSizes, spacing } from 'ui/src/theme'

type ConnectedDappsProps = {
  sessions: WalletConnectSession[]
  backButton?: JSX.Element
}

export function ConnectedDappsList({ backButton, sessions }: ConnectedDappsProps): JSX.Element {
  const { t } = useTranslation()
  const [isEditing, setIsEditing] = useState(false)
  const [selectedSession, setSelectedSession] = useState<WalletConnectSession>()

  return (
    <>
      <AnimatedFlex fill entering={FadeIn} exiting={FadeOut} pt="spacing12">
        <Flex row alignItems="center" justifyContent="space-between" px="$spacing24">
          <Flex gap="$none" width={iconSizes.icon40}>
            {backButton ?? <BackButton />}
          </Flex>
          <Text color="neutral1" variant="bodyLarge">
            {t('Manage connections')}
          </Text>
          <TouchableArea
            width={iconSizes.icon40}
            onPress={(): void => {
              setIsEditing(!isEditing)
            }}>
            <Text
              color={isEditing ? 'accent1' : 'neutral2'}
              textAlign="right"
              variant="subheadSmall">
              {isEditing ? t('Done') : t('Edit')}
            </Text>
          </TouchableArea>
        </Flex>

        {sessions.length > 0 ? (
          <FlatList
            columnWrapperStyle={ColumnStyle.base}
            contentContainerStyle={{ paddingHorizontal: spacing.spacing24 }}
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
          <Flex fill alignItems="center" gap="$spacing8" px="$spacing24" style={emptyCardStyle}>
            <Text color="neutral1" variant="subheadLarge">
              {t('No apps connected')}
            </Text>
            <Text color="neutral2" textAlign="center" variant="bodySmall">
              {t('Connect to an app by scanning a code via WalletConnect')}
            </Text>
          </Flex>
        )}
      </AnimatedFlex>
      {selectedSession && (
        <DappConnectedNetworkModal
          session={selectedSession}
          onClose={(): void => setSelectedSession(undefined)}
        />
      )}
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
