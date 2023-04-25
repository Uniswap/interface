import { getSdkError } from '@walletconnect/utils'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import 'react-native-reanimated'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import RemoveButton from 'src/components/explore/RemoveButton'
import { Chevron } from 'src/components/icons/Chevron'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { DappHeaderIcon } from 'src/components/WalletConnect/DappHeaderIcon'
import { NetworkLogos } from 'src/components/WalletConnect/NetworkLogos'
import { CHAIN_INFO } from 'src/constants/chains'
import { pushNotification } from 'src/features/notifications/notificationSlice'
import { AppNotificationType } from 'src/features/notifications/types'
import { ElementName } from 'src/features/telemetry/constants'
import { useActiveAccountAddressWithThrow } from 'src/features/wallet/hooks'
import { WalletConnectEvent } from 'src/features/walletConnect/saga'
import { disconnectFromApp } from 'src/features/walletConnect/WalletConnect'
import {
  removeSession,
  WalletConnectSession,
  WalletConnectSessionV1,
} from 'src/features/walletConnect/walletConnectSlice'
import { wcWeb3Wallet } from 'src/features/walletConnectV2/saga'
import { toSupportedChainId } from 'src/utils/chainId'
import { openUri } from 'src/utils/linking'
import { logger } from 'src/utils/logger'
import { ONE_SECOND_MS } from 'src/utils/time'

export function DappConnectionItem({
  session,
  isEditing,
  onPressChangeNetwork,
}: {
  session: WalletConnectSession
  isEditing: boolean
  onPressChangeNetwork: (session: WalletConnectSessionV1) => void
}): JSX.Element {
  const theme = useAppTheme()
  const { t } = useTranslation()
  const { dapp } = session
  const dispatch = useAppDispatch()
  const address = useActiveAccountAddressWithThrow()

  const onDisconnect = async (): Promise<void> => {
    if (session.version === '1') {
      disconnectFromApp(session.id)
      return
    }

    if (session.version === '2') {
      try {
        await wcWeb3Wallet.disconnectSession({
          topic: session.id,
          reason: getSdkError('USER_DISCONNECTED'),
        })
        dispatch(removeSession({ account: address, sessionId: session.id }))
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
      } catch (e) {
        if (e instanceof Error) {
          logger.error(
            'DappConnectionItem',
            'onDisconnect',
            'Failed to disconnect session',
            e.message
          )
          Alert.alert(
            t('WalletConnect Error'),
            t('Failed to disconnect from {{ dapp }}. \n\n Error: {{ message }}', {
              dapp: dapp.name,
              message: e.message,
            })
          )
        }
      }
    }
  }

  return (
    <Flex
      bg="background2"
      borderRadius="rounded16"
      gap="spacing12"
      justifyContent="space-between"
      mb="spacing12"
      pb="spacing12"
      pt="spacing24"
      px="spacing12"
      width="48%">
      <Flex
        alignSelf="flex-end"
        position="absolute"
        right={theme.spacing.spacing12}
        top={theme.spacing.spacing12}>
        {isEditing ? (
          <RemoveButton onPress={onDisconnect} />
        ) : (
          <Box height={theme.iconSizes.icon24} width={theme.iconSizes.icon24} />
        )}
      </Flex>
      <TouchableArea
        flex={1}
        name={ElementName.WCOpenDapp}
        onPress={(): Promise<void> => openUri(dapp.url)}>
        <Flex grow alignItems="center" gap="spacing8">
          <DappHeaderIcon dapp={dapp} showChain={false} />
          <Text numberOfLines={2} textAlign="center" variant="buttonLabelMedium">
            {dapp.name || dapp.url}
          </Text>
          <Text
            color="accentActive"
            numberOfLines={1}
            textAlign="center"
            variant="buttonLabelMicro">
            {dapp.url}
          </Text>
        </Flex>
      </TouchableArea>
      {session.version === '1' ? (
        <ChangeNetworkButton session={session} onPressChangeNetwork={onPressChangeNetwork} />
      ) : (
        <NetworkLogos
          showFirstChainLabel
          backgroundColor="background3"
          borderRadius="roundedFull"
          chains={session.chains}
          p="spacing8"
        />
      )}
    </Flex>
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
    <TouchableArea
      name={ElementName.WCDappSwitchNetwork}
      onPress={(): void => onPressChangeNetwork(session)}>
      <Flex
        row
        shrink
        backgroundColor="background3"
        borderRadius="roundedFull"
        gap="none"
        justifyContent="space-between"
        p="spacing8">
        {supportedChainId ? (
          <Flex fill row shrink gap="spacing8">
            <NetworkLogo chainId={supportedChainId} />
            <Flex shrink>
              <Text
                color="textSecondary"
                numberOfLines={1}
                textAlign="center"
                variant="buttonLabelSmall">
                {CHAIN_INFO[supportedChainId].label}
              </Text>
            </Flex>
          </Flex>
        ) : (
          <Text color="textSecondary" textAlign="center" variant="buttonLabelSmall">
            {t('Unsupported chain')}
          </Text>
        )}
        <Chevron
          color={theme.colors.textTertiary}
          direction="s"
          height={theme.iconSizes.icon20}
          width={theme.iconSizes.icon20}
        />
      </Flex>
    </TouchableArea>
  )
}
