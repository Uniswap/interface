import { getSdkError } from '@walletconnect/utils'
import React from 'react'
import { useTranslation } from 'react-i18next'
import 'react-native-reanimated'
import { useAppDispatch } from 'src/app/hooks'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { DappHeaderIcon } from 'src/components/WalletConnect/DappHeaderIcon'
import { ModalName } from 'src/features/telemetry/constants'
import { wcWeb3Wallet } from 'src/features/walletConnect/saga'
import { removeSession, WalletConnectSession } from 'src/features/walletConnect/walletConnectSlice'
import { Button, Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { NetworkLogo } from 'wallet/src/components/CurrencyLogo/NetworkLogo'
import { CHAIN_INFO } from 'wallet/src/constants/chains'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'
import { WalletConnectEvent } from 'wallet/src/features/walletConnect/types'
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
      logger.error(error, { tags: { file: 'DappConnectedNetworkModal', function: 'onDisconnect' } })
    }
  }

  return (
    <BottomSheetModal name={ModalName.WCDappConnectedNetworks} onClose={onClose}>
      <Flex centered gap="$spacing16" px="$spacing24" py="$spacing12">
        <Flex alignItems="center" gap="$spacing8">
          <DappHeaderIcon dapp={dapp} />
          <Text textAlign="center" variant="buttonLabel2">
            <Text variant="body1">{t('Connected to ')}</Text>
            {dapp.name || dapp.url}
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
                    bg="$statusSuccess"
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
            {t('Close')}
          </Button>
          <Button fill theme="detrimental" onPress={onDisconnect}>
            {t('Disconnect')}
          </Button>
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}
