import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, StyleSheet } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAppDispatch } from 'src/app/hooks'
import { BackButton } from 'src/components/buttons/BackButton'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { DappConnectedNetworkModal } from 'src/components/WalletConnect/ConnectedDapps/DappConnectedNetworksModal'
import { DappConnectionItem } from 'src/components/WalletConnect/ConnectedDapps/DappConnectionItem'
import { openModal } from 'src/features/modals/modalSlice'
import {
  removePendingSession,
  WalletConnectSession,
} from 'src/features/walletConnect/walletConnectSlice'
import { AnimatedFlex, Flex, Icons, Text, TouchableArea, useDeviceDimensions } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { ModalName } from 'wallet/src/telemetry/constants'

type ConnectedDappsProps = {
  sessions: WalletConnectSession[]
  backButton?: JSX.Element
}

export function ConnectedDappsList({ backButton, sessions }: ConnectedDappsProps): JSX.Element {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const { fullHeight } = useDeviceDimensions()
  const [isEditing, setIsEditing] = useState(false)
  const [selectedSession, setSelectedSession] = useState<WalletConnectSession>()

  const onPressScan = useCallback(() => {
    // in case we received a pending session from a previous scan after closing modal
    dispatch(removePendingSession())
    dispatch(
      openModal({ name: ModalName.WalletConnectScan, initialState: ScannerModalState.ScanQr })
    )
  }, [dispatch])

  return (
    <>
      <AnimatedFlex fill entering={FadeIn} exiting={FadeOut} pt="$spacing12">
        <Flex
          row
          alignItems="center"
          justifyContent="space-between"
          pb="$spacing12"
          px="$spacing16">
          <Flex alignItems="flex-start" flexBasis="15%">
            {backButton ?? <BackButton />}
          </Flex>
          <Flex alignItems="center" flexBasis="70%">
            <Text color="$neutral1" numberOfLines={1} variant="body1">
              {t('walletConnect.dapps.manage.title')}
            </Text>
          </Flex>
          <Flex alignItems="flex-end" flexBasis="15%">
            {sessions.length > 0 ? (
              <TouchableArea
                onPress={(): void => {
                  setIsEditing(!isEditing)
                }}>
                {isEditing ? (
                  <Icons.Edit color="$accent1" size="$icon.20" />
                ) : (
                  <Icons.Edit color="$neutral2" size="$icon.20" />
                )}
              </TouchableArea>
            ) : (
              <TouchableArea onPress={onPressScan}>
                <Icons.Scan color="$neutral2" size="$icon.20" />
              </TouchableArea>
            )}
          </Flex>
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
              {t('walletConnect.dapps.manage.empty.title')}
            </Text>
            <Text color="$neutral2" textAlign="center" variant="body2">
              {t('walletConnect.dapps.empty.description')}
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
