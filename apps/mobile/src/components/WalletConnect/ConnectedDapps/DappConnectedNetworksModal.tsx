import { getSdkError } from '@walletconnect/utils'
import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import 'react-native-reanimated'
import { useAppDispatch } from 'src/app/hooks'
import { DappHeaderIcon } from 'src/components/WalletConnect/DappHeaderIcon'
import { wcWeb3Wallet } from 'src/features/walletConnect/saga'
import { WalletConnectSession, removeSession } from 'src/features/walletConnect/walletConnectSlice'
import { Button, Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { NetworkLogo } from 'wallet/src/components/CurrencyLogo/NetworkLogo'
import { BottomSheetModal } from 'wallet/src/components/modals/BottomSheetModal'
import { CHAIN_INFO } from 'wallet/src/constants/chains'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'
import { WalletConnectEvent } from 'wallet/src/features/walletConnect/types'
import { ModalName } from 'wallet/src/telemetry/constants'
interface DappConnectedNetworkModalProps {
  session: WalletConnectSession
  onClose: () => void
}

export function DappConnectedNetworkModal({
  session,
  onClose,
}: DappConnectedNetworkModalProps): JSX.Element {
  const { t } = useTranslation()
  const address = useActiveAccountAddressWithThrow()
  const dispatch = useAppDispatch()
  const { dapp, id } = session

  const onDisconnect = async (): Promise<void> => {
    try {
      dispatch(removeSession({ account: address, sessionId: id }))
      // Explicitly verify that WalletConnect has this session id as an active session
      // It's possible that the session was already disconnected on WC but wasn't updated locally in redux
      const sessions = wcWeb3Wallet.getActiveSessions()
      if (sessions[session.id]) {
        await wcWeb3Wallet.disconnectSession({
          topic: session.id,
          reason: getSdkError('USER_DISCONNECTED'),
        })
      }
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
      logger.error(error, { tags: { file: 'DappConnectedNetworkModal', function: 'onDisconnect' } })
    }
  }

  return (
    <BottomSheetModal name={ModalName.WCDappConnectedNetworks} onClose={onClose}>
      <Flex centered gap="$spacing16" px="$spacing24" py="$spacing12">
        <Flex alignItems="center" gap="$spacing8">
          <DappHeaderIcon dapp={dapp} />
          <Text textAlign="center" variant="buttonLabel2">
            <Trans
              components={{ highlight: <Text variant="body1" /> }}
              i18nKey="walletConnect.dapps.connection"
              values={{ dappNameOrUrl: dapp.name || dapp.url }}
            />
          </Text>
          <Text color="$accent1" numberOfLines={1} textAlign="center" variant="buttonLabel4">
            {dapp.url}
          </Text>
        </Flex>
        <Flex row>
          <Flex
            grow
            borderColor="$surface3"
            borderRadius="$rounded12"
            borderWidth={1}
            gap="$spacing16"
            p="$spacing16">
            {session.chains.map((chainId) => (
              <Flex key={chainId} row alignItems="center" justifyContent="space-between">
                <NetworkLogo chainId={chainId} size={iconSizes.icon24} />
                <Text color="$neutral1" numberOfLines={1} variant="body1">
                  {CHAIN_INFO[chainId].label}
                </Text>
                <Flex centered height={iconSizes.icon24} width={iconSizes.icon24}>
                  <Flex
                    backgroundColor="$statusSuccess"
                    borderRadius="$roundedFull"
                    height={iconSizes.icon8}
                    width={iconSizes.icon8}
                  />
                </Flex>
              </Flex>
            ))}
          </Flex>
        </Flex>
        <Flex centered row gap="$spacing16">
          <Button fill theme="secondary" onPress={onClose}>
            {t('common.button.close')}
          </Button>
          <Button fill theme="detrimental" onPress={onDisconnect}>
            {t('common.button.disconnect')}
          </Button>
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}
