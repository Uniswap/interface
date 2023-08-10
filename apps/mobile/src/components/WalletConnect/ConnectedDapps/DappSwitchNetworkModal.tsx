import { notificationAsync, selectionAsync } from 'expo-haptics'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { Flex } from 'src/components/layout'
import { Separator } from 'src/components/layout/Separator'
import { ActionSheetModal } from 'src/components/modals/ActionSheetModal'
import { useNetworkOptions } from 'src/components/Network/hooks'
import { Text } from 'src/components/Text'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { changeChainId, disconnectFromApp } from 'src/features/walletConnect/WalletConnect'
import {
  removeSession,
  WalletConnectSessionV1,
} from 'src/features/walletConnect/walletConnectSlice'
import { ChainId } from 'wallet/src/constants/chains'
import { toSupportedChainId } from 'wallet/src/features/chains/utils'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

interface DappSwitchNetworkModalProps {
  selectedSession: WalletConnectSessionV1
  onClose: () => void
}

export function DappSwitchNetworkModal({
  selectedSession,
  onClose,
}: DappSwitchNetworkModalProps): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const address = useActiveAccountAddressWithThrow()

  const onPress = useCallback(
    async (chainId: ChainId | null) => {
      if (!chainId) return
      await selectionAsync()
      changeChainId(selectedSession.id, chainId)
      onClose()
    },
    [selectedSession.id, onClose]
  )

  const networkOptions = useNetworkOptions({
    selectedChain: toSupportedChainId(selectedSession.dapp.chain_id),
    onPress,
  })

  const options = useMemo(
    () =>
      networkOptions.concat([
        {
          key: ElementName.Disconnect,
          onPress: async (): Promise<void> => {
            await notificationAsync()
            dispatch(removeSession({ account: address, sessionId: selectedSession.id }))
            // Allow session removal action to complete before disconnecting from app, for immediate UI feedback
            setImmediate(() => disconnectFromApp(selectedSession.id))
            onClose()
          },
          render: () => (
            <>
              <Separator />
              <Flex centered row px="spacing24" py="spacing16">
                <Text color="statusCritical" variant="bodyLarge">
                  {t('Disconnect')}
                </Text>
              </Flex>
            </>
          ),
        },
      ]),
    [networkOptions, onClose, selectedSession.id, address, dispatch, t]
  )

  return (
    <ActionSheetModal
      header={
        <Flex centered gap="spacing4" py="spacing16">
          <Text variant="buttonLabelMedium">{t('Switch Network')}</Text>
          <Text color="accent1" variant="buttonLabelMicro">
            {selectedSession.dapp.url}
          </Text>
        </Flex>
      }
      isVisible={selectedSession !== null}
      name={ModalName.NetworkSelector}
      options={options}
      onClose={onClose}
    />
  )
}
