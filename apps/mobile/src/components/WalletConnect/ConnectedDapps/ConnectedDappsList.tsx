import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, StyleSheet } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { BackButton } from 'src/components/buttons/BackButton'
import { DappConnectedNetworkModal } from 'src/components/WalletConnect/ConnectedDapps/DappConnectedNetworksModal'
import { DappConnectionItem } from 'src/components/WalletConnect/ConnectedDapps/DappConnectionItem'
import { WalletConnectSession } from 'src/features/walletConnect/walletConnectSlice'
import { AnimatedFlex, Flex, Text, TouchableArea, useDeviceDimensions } from 'ui/src'
import { iconSizes, spacing } from 'ui/src/theme'

type ConnectedDappsProps = {
  sessions: WalletConnectSession[]
  backButton?: JSX.Element
}

export function ConnectedDappsList({ backButton, sessions }: ConnectedDappsProps): JSX.Element {
  const { t } = useTranslation()
  const { fullHeight } = useDeviceDimensions()
  const [isEditing, setIsEditing] = useState(false)
  const [selectedSession, setSelectedSession] = useState<WalletConnectSession>()

  return (
    <>
      <AnimatedFlex fill entering={FadeIn} exiting={FadeOut} pt="$spacing12">
        <Flex
          row
          alignItems="center"
          justifyContent="space-between"
          pb="$spacing12"
          px="$spacing16">
          <Flex grow width={iconSizes.icon40}>
            {backButton ?? <BackButton />}
          </Flex>
          <Text color="$neutral1" numberOfLines={1} variant="body1">
            {t('Manage connections')}
          </Text>
          <TouchableArea
            flexGrow={1}
            width={iconSizes.icon40}
            onPress={(): void => {
              setIsEditing(!isEditing)
            }}>
            <Text
              color={isEditing ? '$accent1' : '$neutral2'}
              numberOfLines={1}
              textAlign="right"
              variant="subheading2">
              {isEditing ? t('Done') : t('Edit')}
            </Text>
          </TouchableArea>
        </Flex>

        {sessions.length > 0 ? (
          <FlatList
            columnWrapperStyle={ColumnStyle.base}
            contentContainerStyle={{
              paddingHorizontal: spacing.spacing16,
              paddingTop: spacing.spacing12,
            }}
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
          <Flex
            fill
            alignItems="center"
            gap="$spacing8"
            px="$spacing24"
            style={{
              paddingTop: fullHeight / 5,
            }}>
            <Text color="$neutral1" variant="subheading1">
              {t('No apps connected')}
            </Text>
            <Text color="$neutral2" textAlign="center" variant="body2">
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
