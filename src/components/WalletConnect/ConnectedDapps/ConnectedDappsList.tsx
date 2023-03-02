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
import { DappConnectionItem } from 'src/components/WalletConnect/ConnectedDapps/DappConnectionItem'
import { DappSwitchNetworkModal } from 'src/components/WalletConnect/ConnectedDapps/DappSwitchNetworkModal'
import {
  WalletConnectSession,
  WalletConnectSessionV1,
} from 'src/features/walletConnect/walletConnectSlice'
import { dimensions } from 'src/styles/sizing'

type ConnectedDappsProps = {
  sessions: WalletConnectSession[]
  backButton?: JSX.Element
}

export function ConnectedDappsList({ backButton, sessions }: ConnectedDappsProps): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const [isEditing, setIsEditing] = useState(false)
  const [selectedSession, setSelectedSession] = useState<WalletConnectSessionV1>()

  return (
    <>
      <AnimatedFlex fill entering={FadeIn} exiting={FadeOut} pt="spacing16" px="spacing24">
        <Flex row alignItems="center" justifyContent="space-between">
          <Box width={theme.iconSizes.icon40}>{backButton ?? <BackButton />}</Box>
          <Text color="textPrimary" variant="bodyLarge">
            {t('Manage connections')}
          </Text>
          <TouchableArea
            width={theme.iconSizes.icon40}
            onPress={(): void => {
              setIsEditing(!isEditing)
            }}>
            <Text
              color={isEditing ? 'accentActive' : 'textTertiary'}
              textAlign="right"
              variant="subheadSmall">
              {isEditing ? t('Done') : t('Edit')}
            </Text>
          </TouchableArea>
        </Flex>

        {sessions.length > 0 ? (
          <FlatList
            columnWrapperStyle={ColumnStyle.base}
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
          <Flex fill alignItems="center" gap="spacing8" style={emptyCardStyle}>
            <Text color="textPrimary" variant="subheadLarge">
              {t('No apps connected')}
            </Text>
            <Text color="textSecondary" textAlign="center" variant="bodySmall">
              {t('Connect to an app by scanning a code via WalletConnect')}
            </Text>
          </Flex>
        )}
      </AnimatedFlex>
      {selectedSession && (
        <DappSwitchNetworkModal
          selectedSession={selectedSession}
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
