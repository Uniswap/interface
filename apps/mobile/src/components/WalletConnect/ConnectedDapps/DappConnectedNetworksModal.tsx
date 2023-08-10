import { getSdkError } from '@walletconnect/utils'
import React from 'react'
import { useTranslation } from 'react-i18next'
import 'react-native-reanimated'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { Button, ButtonEmphasis } from 'src/components/buttons/Button'
import { Box, Flex } from 'src/components/layout'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { DappHeaderIcon } from 'src/components/WalletConnect/DappHeaderIcon'
import { ModalName } from 'src/features/telemetry/constants'
import {
  removeSession,
  WalletConnectSessionV2,
} from 'src/features/walletConnect/walletConnectSlice'
import { wcWeb3Wallet } from 'src/features/walletConnectV2/saga'
import { serializeError } from 'utilities/src/errors'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { NetworkLogo } from 'wallet/src/components/CurrencyLogo/NetworkLogo'
import { CHAIN_INFO } from 'wallet/src/constants/chains'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'
import { WalletConnectEvent } from 'wallet/src/features/walletConnect/types'
interface DappConnectedNetworkModalProps {
  session: WalletConnectSessionV2
  onClose: () => void
}

export function DappConnectedNetworkModal({
  session,
  onClose,
}: DappConnectedNetworkModalProps): JSX.Element {
  const { t } = useTranslation()
  const address = useActiveAccountAddressWithThrow()
  const dispatch = useAppDispatch()
  const theme = useAppTheme()
  const { dapp, id } = session

  const onDisconnect = async (): Promise<void> => {
    try {
      dispatch(removeSession({ account: address, sessionId: id }))
      await wcWeb3Wallet.disconnectSession({
        topic: id,
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
      onClose()
    } catch (error) {
      logger.error('Unable to disconnect WalletConnect session', {
        tags: {
          file: 'DappConnectedNetworkModal',
          function: 'onDisconnect',
          error: serializeError(error),
        },
      })
    }
  }

  return (
    <BottomSheetModal name={ModalName.WCDappConnectedNetworks} onClose={onClose}>
      <Flex centered gap="spacing16" mb="spacing24" px="spacing24" py="spacing12">
        <Flex alignItems="center" gap="spacing8">
          <DappHeaderIcon dapp={dapp} showChain={false} />
          <Text textAlign="center" variant="buttonLabelMedium">
            <Text variant="bodyLarge">{t('Connected to ')}</Text>
            {dapp.name || dapp.url}
          </Text>
          <Text color="accent1" numberOfLines={1} textAlign="center" variant="buttonLabelMicro">
            {dapp.url}
          </Text>
        </Flex>
        <Box flexDirection="row">
          <Flex
            grow
            borderColor="surface3"
            borderRadius="rounded12"
            borderWidth={1}
            gap="spacing16"
            p="spacing16">
            {session.chains.map((chainId) => (
              <Flex key={chainId} row alignItems="center" justifyContent="space-between">
                <NetworkLogo chainId={chainId} size={theme.iconSizes.icon24} />
                <Text color="neutral1" numberOfLines={1} variant="bodyLarge">
                  {CHAIN_INFO[chainId].label}
                </Text>
                <Flex centered height={theme.iconSizes.icon24} width={theme.iconSizes.icon24}>
                  <Box
                    bg="statusSuccess"
                    borderRadius="roundedFull"
                    height={theme.iconSizes.icon8}
                    width={theme.iconSizes.icon8}
                  />
                </Flex>
              </Flex>
            ))}
          </Flex>
        </Box>
        <Flex centered row>
          <Button fill emphasis={ButtonEmphasis.Secondary} label={t('Close')} onPress={onClose} />
          <Button
            fill
            emphasis={ButtonEmphasis.Detrimental}
            label={t('Disconnect')}
            onPress={onDisconnect}
          />
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}
