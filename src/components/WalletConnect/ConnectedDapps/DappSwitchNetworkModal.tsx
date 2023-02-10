import { notificationAsync, selectionAsync } from 'expo-haptics'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'src/components/layout'
import { Separator } from 'src/components/layout/Separator'
import { ActionSheetModal } from 'src/components/modals/ActionSheetModal'
import { useNetworkOptions } from 'src/components/Network/hooks'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { changeChainId, disconnectFromApp } from 'src/features/walletConnect/WalletConnect'
import { WalletConnectSessionV1 } from 'src/features/walletConnect/walletConnectSlice'
import { toSupportedChainId } from 'src/utils/chainId'

interface DappSwitchNetworkModalProps {
  selectedSession: WalletConnectSessionV1
  onClose: () => void
}

export function DappSwitchNetworkModal({
  selectedSession,
  onClose,
}: DappSwitchNetworkModalProps): JSX.Element {
  const { t } = useTranslation()

  const onPress = useCallback(
    (chainId: ChainId | null) => {
      if (!chainId) return
      selectionAsync()
      changeChainId(selectedSession.id, chainId)
      onClose()
    },
    [selectedSession.id, onClose]
  )

  const networkOptions = useNetworkOptions(
    toSupportedChainId(selectedSession.dapp.chain_id),
    onPress
  )

  const options = useMemo(
    () =>
      networkOptions.concat([
        {
          key: ElementName.Disconnect,
          onPress: (): void => {
            notificationAsync()
            disconnectFromApp(selectedSession.id)
            onClose()
          },
          render: () => (
            <>
              <Separator />
              <Flex centered row px="spacing24" py="spacing16">
                <Text color="accentCritical" variant="bodyLarge">
                  {t('Disconnect')}
                </Text>
              </Flex>
            </>
          ),
        },
      ]),
    [networkOptions, onClose, selectedSession.id, t]
  )

  return (
    <ActionSheetModal
      header={
        <Flex centered gap="spacing4" py="spacing16">
          <Text variant="buttonLabelMedium">{t('Switch Network')}</Text>
          <Text color="accentActive" variant="buttonLabelMicro">
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
