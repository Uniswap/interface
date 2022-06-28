import { notificationAsync, selectionAsync } from 'expo-haptics'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import Check from 'src/assets/icons/check.svg'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { Box, Flex } from 'src/components/layout'
import { Separator } from 'src/components/layout/Separator'
import { ActionSheetModal } from 'src/components/modals/ActionSheetModal'
import { Text } from 'src/components/Text'
import { CHAIN_INFO } from 'src/constants/chains'
import { useActiveChainIds } from 'src/features/chains/utils'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { changeChainId, disconnectFromApp } from 'src/features/walletConnect/WalletConnect'
import { WalletConnectSession } from 'src/features/walletConnect/walletConnectSlice'
import { toSupportedChainId } from 'src/utils/chainId'

interface DappSwitchNetworkModalProps {
  selectedSession: WalletConnectSession
  onClose: () => void
}

export function DappSwitchNetworkModal({ selectedSession, onClose }: DappSwitchNetworkModalProps) {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const activeChains = useActiveChainIds()

  const options = useMemo(
    () =>
      activeChains
        .map((chainId) => {
          const info = CHAIN_INFO[chainId]
          return {
            key: `${ElementName.NetworkButton}-${chainId}`,
            onPress: () => {
              selectionAsync()
              changeChainId(selectedSession.id, chainId)
              onClose()
            },
            render: () => (
              <>
                <Separator />
                <Flex row alignItems="center" justifyContent="space-between" px="lg" py="md">
                  <NetworkLogo chainId={chainId} size={24} />
                  <Text color="textPrimary" variant="subhead">
                    {info.label}
                  </Text>
                  <Box height={24} width={24}>
                    {chainId === toSupportedChainId(selectedSession.dapp.chain_id) && (
                      <Check color={theme.colors.textSecondary} height={24} width={24} />
                    )}
                  </Box>
                </Flex>
              </>
            ),
          }
        })
        .concat([
          {
            key: ElementName.Disconnect,
            onPress: () => {
              notificationAsync()
              disconnectFromApp(selectedSession.id)
              onClose()
            },
            render: () => (
              <>
                <Separator />
                <Flex centered row px="lg" py="md">
                  <Text color="accentFailure" variant="subhead">
                    {t('Disconnect')}
                  </Text>
                </Flex>
              </>
            ),
          },
        ]),
    [
      activeChains,
      onClose,
      selectedSession.dapp.chain_id,
      selectedSession.id,
      t,
      theme.colors.textSecondary,
    ]
  )

  return (
    <ActionSheetModal
      header={
        <Flex centered gap="xxs" py="md">
          <Text variant="mediumLabel">{t('Switch Network')}</Text>
          <Text color="deprecated_blue" variant="caption">
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
