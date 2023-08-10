import { getSdkError } from '@walletconnect/utils'
import { ImpactFeedbackStyle } from 'expo-haptics'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { NativeSyntheticEvent, StyleSheet } from 'react-native'
import ContextMenu, { ContextMenuOnPressNativeEvent } from 'react-native-context-menu-view'
import 'react-native-reanimated'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { AnimatedTouchableArea, TouchableArea } from 'src/components/buttons/TouchableArea'
import { Chevron } from 'src/components/icons/Chevron'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { DappHeaderIcon } from 'src/components/WalletConnect/DappHeaderIcon'
import { NetworkLogos } from 'src/components/WalletConnect/NetworkLogos'
import { ElementName } from 'src/features/telemetry/constants'
import { disconnectFromApp } from 'src/features/walletConnect/WalletConnect'
import {
  removeSession,
  WalletConnectSession,
  WalletConnectSessionV1,
} from 'src/features/walletConnect/walletConnectSlice'
import { wcWeb3Wallet } from 'src/features/walletConnectV2/saga'
import { serializeError } from 'utilities/src/errors'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { NetworkLogo } from 'wallet/src/components/CurrencyLogo/NetworkLogo'
import { CHAIN_INFO } from 'wallet/src/constants/chains'
import { toSupportedChainId } from 'wallet/src/features/chains/utils'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'
import { WalletConnectEvent } from 'wallet/src/features/walletConnect/types'

export function DappConnectionItem({
  session,
  isEditing,
  onPressChangeNetwork,
}: {
  session: WalletConnectSession
  isEditing: boolean
  onPressChangeNetwork: (session: WalletConnectSession) => void
}): JSX.Element {
  const theme = useAppTheme()
  const { t } = useTranslation()
  const { dapp } = session
  const dispatch = useAppDispatch()
  const address = useActiveAccountAddressWithThrow()

  const onDisconnect = async (): Promise<void> => {
    if (session.version === '1') {
      dispatch(removeSession({ account: address, sessionId: session.id }))
      // Allow session removal action to complete before disconnecting from app, for immediate UI feedback
      setImmediate(() => disconnectFromApp(session.id))
      return
    }

    if (session.version === '2') {
      try {
        dispatch(removeSession({ account: address, sessionId: session.id }))
        await wcWeb3Wallet.disconnectSession({
          topic: session.id,
          reason: getSdkError('USER_DISCONNECTED'),
        })
        dispatch(
          pushNotification({
            type: AppNotificationType.WalletConnect,
            address,
            dappName: dapp.name,
            event: WalletConnectEvent.Disconnected,
            imageUrl: dapp.icon,
            hideDelay: 3 * ONE_SECOND_MS,
          })
        )
      } catch (error) {
        logger.error(error, {
          tags: {
            file: 'DappConnectionItem',
            function: 'onDisconnect',
            error: serializeError(error),
          },
        })
      }
    }
  }

  const menuActions = [{ title: t('Disconnect'), systemIcon: 'trash', destructive: true }]

  const onPress = async (e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>): Promise<void> => {
    if (e.nativeEvent.index === 0) {
      await onDisconnect()
    }
  }

  return (
    <ContextMenu actions={menuActions} style={styles.container} onPress={onPress}>
      <Flex
        grow
        bg="surface2"
        borderRadius="rounded16"
        gap="spacing12"
        justifyContent="space-between"
        mb="spacing12"
        pb="spacing12"
        pt="spacing24"
        px="spacing12">
        <Flex
          alignSelf="flex-end"
          position="absolute"
          right={theme.spacing.spacing12}
          top={theme.spacing.spacing12}
          zIndex="tooltip">
          {isEditing ? (
            <AnimatedTouchableArea
              hapticFeedback
              alignItems="center"
              backgroundColor="neutral3"
              borderRadius="roundedFull"
              entering={FadeIn}
              exiting={FadeOut}
              height={theme.iconSizes.icon28}
              justifyContent="center"
              width={theme.iconSizes.icon28}
              zIndex="tooltip"
              onPress={onDisconnect}>
              <Box backgroundColor="surface1" borderRadius="rounded12" height={2} width={14} />
            </AnimatedTouchableArea>
          ) : (
            <Box height={theme.iconSizes.icon28} width={theme.iconSizes.icon28} />
          )}
        </Flex>
        <Flex grow alignItems="center" gap="spacing8">
          <DappHeaderIcon dapp={dapp} showChain={false} />
          <Text numberOfLines={2} textAlign="center" variant="buttonLabelMedium">
            {dapp.name || dapp.url}
          </Text>
          <Text color="accent1" numberOfLines={1} textAlign="center" variant="buttonLabelMicro">
            {dapp.url}
          </Text>
        </Flex>

        {session.version === '1' ? (
          <ChangeNetworkButton session={session} onPressChangeNetwork={onPressChangeNetwork} />
        ) : (
          <TouchableArea
            hapticFeedback
            hapticStyle={ImpactFeedbackStyle.Medium}
            testID={ElementName.WCDappSwitchNetwork}
            onPress={(): void => onPressChangeNetwork(session)}>
            <NetworkLogos
              showFirstChainLabel
              backgroundColor="surface2"
              borderRadius="roundedFull"
              chains={session.chains}
              p="spacing8"
            />
          </TouchableArea>
        )}
      </Flex>
    </ContextMenu>
  )
}

function ChangeNetworkButton({
  session,
  onPressChangeNetwork,
}: {
  session: WalletConnectSessionV1
  onPressChangeNetwork: (session: WalletConnectSessionV1) => void
}): JSX.Element {
  const theme = useAppTheme()
  const { t } = useTranslation()

  // Only WC v1.0 connections have a current chain_id
  const supportedChainId = toSupportedChainId(session.dapp.chain_id)

  return (
    <TouchableArea onPress={(): void => onPressChangeNetwork(session)}>
      <Flex
        row
        shrink
        backgroundColor="surface2"
        borderRadius="roundedFull"
        gap="none"
        justifyContent="space-between"
        p="spacing8">
        {supportedChainId ? (
          <Flex fill row shrink gap="spacing8">
            <NetworkLogo chainId={supportedChainId} />
            <Flex shrink>
              <Text
                color="neutral2"
                numberOfLines={1}
                textAlign="center"
                variant="buttonLabelSmall">
                {CHAIN_INFO[supportedChainId].label}
              </Text>
            </Flex>
          </Flex>
        ) : (
          <Text color="neutral2" textAlign="center" variant="buttonLabelSmall">
            {t('Unsupported chain')}
          </Text>
        )}
        <Chevron
          color={theme.colors.neutral3}
          direction="s"
          height={theme.iconSizes.icon20}
          width={theme.iconSizes.icon20}
        />
      </Flex>
    </TouchableArea>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '48%',
  },
})
