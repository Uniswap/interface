import { getSdkError } from '@walletconnect/utils'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import 'react-native-reanimated'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { Button, ButtonEmphasis } from 'src/components/buttons/Button'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { Box, Flex } from 'src/components/layout'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { DappHeaderIcon } from 'src/components/WalletConnect/DappHeaderIcon'
import { CHAIN_INFO } from 'src/constants/chains'
import { pushNotification } from 'src/features/notifications/notificationSlice'
import { AppNotificationType } from 'src/features/notifications/types'
import { ModalName } from 'src/features/telemetry/constants'
import { useActiveAccountAddressWithThrow } from 'src/features/wallet/hooks'
import { WalletConnectEvent } from 'src/features/walletConnect/saga'
import {
  removeSession,
  WalletConnectSessionV2,
} from 'src/features/walletConnect/walletConnectSlice'
import { wcWeb3Wallet } from 'src/features/walletConnectV2/saga'
import { logger } from 'src/utils/logger'
import { ONE_SECOND_MS } from 'wallet/src/utils/time'
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
      await wcWeb3Wallet.disconnectSession({
        topic: id,
        reason: getSdkError('USER_DISCONNECTED'),
      })
      dispatch(removeSession({ account: address, sessionId: id }))
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

  return (
    <BottomSheetModal name={ModalName.WCDappConnectedNetworks} onClose={onClose}>
      <Flex centered gap="spacing16" mb="spacing24" px="spacing24" py="spacing12">
        <Flex alignItems="center" gap="spacing8">
          <DappHeaderIcon dapp={dapp} showChain={false} />
          <Text textAlign="center" variant="buttonLabelMedium">
            <Text variant="bodyLarge">{t('Connected to ')}</Text>
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
        <Box flexDirection="row">
          <Flex
            grow
            borderColor="backgroundOutline"
            borderRadius="rounded12"
            borderWidth={1}
            gap="spacing16"
            p="spacing16">
            {session.chains.map((chainId) => (
              <Flex key={chainId} row alignItems="center" justifyContent="space-between">
                <NetworkLogo chainId={chainId} size={theme.iconSizes.icon24} />
                <Text color="textPrimary" numberOfLines={1} variant="bodyLarge">
                  {CHAIN_INFO[chainId].label}
                </Text>
                <Flex centered height={theme.iconSizes.icon24} width={theme.iconSizes.icon24}>
                  <Box
                    bg="accentSuccess"
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
