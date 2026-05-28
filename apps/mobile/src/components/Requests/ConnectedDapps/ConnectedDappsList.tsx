import { getSdkError, INTERNAL_ERRORS } from '@walletconnect/utils'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, StyleSheet } from 'react-native'
import { useDispatch } from 'react-redux'
import { BackButton } from 'src/components/buttons/BackButton'
import { DappConnectionItem } from 'src/components/Requests/ConnectedDapps/DappConnectionItem'
import { openModal } from 'src/features/modals/modalSlice'
import { wcWeb3Wallet } from 'src/features/walletConnect/walletConnectClient'
import {
  removePendingSession,
  removeSession,
  WalletConnectSession,
} from 'src/features/walletConnect/walletConnectSlice'
import { Flex, Text, TouchableArea } from 'ui/src'
import { Scan } from 'ui/src/components/icons'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { spacing } from 'ui/src/theme'
import { ScannerModalState } from 'uniswap/src/components/ReceiveQRCode/constants'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { WalletConnectEvent } from 'uniswap/src/types/walletConnect'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { DappEllipsisDropdown } from 'wallet/src/components/settings/DappEllipsisDropdown/DappEllipsisDropdown'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

type ConnectedDappsProps = {
  sessions: WalletConnectSession[]
  backButton?: JSX.Element
  selectedAddress?: string
}

export function ConnectedDappsList({ backButton, sessions, selectedAddress }: ConnectedDappsProps): JSX.Element {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const { fullHeight } = useDeviceDimensions()
  const [isEditing, setIsEditing] = useState(false)
  const { address } = useActiveAccountWithThrow()

  const onPressScan = useCallback(() => {
    // in case we received a pending session from a previous scan after closing modal
    dispatch(removePendingSession())
    dispatch(openModal({ name: ModalName.WalletConnectScan, initialState: ScannerModalState.ScanQr }))
  }, [dispatch])

  const disconnectSession = useCallback(
    async (session: WalletConnectSession, isNotification = true) => {
      try {
        dispatch(removeSession({ sessionId: session.id }))
        try {
          await wcWeb3Wallet.disconnectSession({
            topic: session.id,
            reason: getSdkError('USER_DISCONNECTED'),
          })
        } catch (error: unknown) {
          const isAcceptableError =
            error instanceof Error && error.message.startsWith(INTERNAL_ERRORS.NO_MATCHING_KEY.message)

          if (!isAcceptableError) {
            // caught by logging catch block
            throw error
          }
        }

        if (isNotification) {
          dispatch(
            pushNotification({
              type: AppNotificationType.WalletConnect,
              address,
              dappName: session.dappRequestInfo.name,
              event: WalletConnectEvent.Disconnected,
              imageUrl: session.dappRequestInfo.icon,
              hideDelay: 3 * ONE_SECOND_MS,
            }),
          )
        }
      } catch (error) {
        logger.error(error, { tags: { file: 'DappConnectionItem', function: 'onDisconnect' } })
      }
    },
    [address, dispatch],
  )

  return (
    <>
      <Flex row alignItems="center" justifyContent="space-between" pb="$spacing12" px="$spacing16">
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
            <DappEllipsisDropdown
              setIsEditing={setIsEditing}
              isEditing={isEditing}
              removeAllDappConnections={async () => {
                try {
                  await Promise.all(
                    sessions.map(async (session) => {
                      await disconnectSession(session, false)
                    }),
                  )
                } catch (error) {
                  logger.error(error, { tags: { file: 'ConnectedDappsList', function: 'removeAllDappConnections' } })
                }

                dispatch(
                  pushNotification({
                    type: AppNotificationType.Success,
                    title: t('notification.walletConnect.disconnected'),
                    hideDelay: 3 * ONE_SECOND_MS,
                  }),
                )
              }}
            />
          ) : (
            address === selectedAddress && (
              <TouchableArea onPress={onPressScan}>
                <Scan color="$neutral2" size="$icon.20" />
              </TouchableArea>
            )
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
            <DappConnectionItem handleDisconnect={disconnectSession} isEditing={isEditing} session={item} />
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
          }}
        >
          <Text color="$neutral1" variant="subheading1">
            {t('walletConnect.dapps.manage.empty.title')}
          </Text>
          <Text color="$neutral2" textAlign="center" variant="body2">
            {t('walletConnect.dapps.empty.description')}
          </Text>
        </Flex>
      )}
    </>
  )
}

const ColumnStyle = StyleSheet.create({
  base: {
    justifyContent: 'space-between',
  },
})
