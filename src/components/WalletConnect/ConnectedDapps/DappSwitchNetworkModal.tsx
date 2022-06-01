import { notificationAsync, selectionAsync } from 'expo-haptics'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import Check from 'src/assets/icons/check.svg'
import { Button } from 'src/components/buttons/Button'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { Box, Flex } from 'src/components/layout'
import { BottomSheetDetachedModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { CHAIN_INFO } from 'src/constants/chains'
import { useActiveChainIds } from 'src/features/chains/utils'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { useActiveAccountAddressWithThrow } from 'src/features/wallet/hooks'
import { changeChainId, disconnectFromApp } from 'src/features/walletConnect/WalletConnect'
import { WalletConnectSession } from 'src/features/walletConnect/walletConnectSlice'
import { toSupportedChainId } from 'src/utils/chainId'

interface DappSwitchNetworkModalProps {
  selectedSession: WalletConnectSession
  onClose: () => void
}

function Separator() {
  return <Box bg="neutralOutline" height={1} />
}

export function DappSwitchNetworkModal({ selectedSession, onClose }: DappSwitchNetworkModalProps) {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const activeChains = useActiveChainIds()
  const activeAccountAddress = useActiveAccountAddressWithThrow()

  return (
    <BottomSheetDetachedModal
      hideHandlebar
      backgroundColor="transparent"
      isVisible={selectedSession !== null}
      name={ModalName.NetworkSelector}
      onClose={onClose}>
      <Flex centered bg="neutralSurface" borderRadius="lg" gap="none">
        <Flex centered gap="xxs" py="md">
          <Text variant="mediumLabel">{t('Switch Network')}</Text>
          <Text color="deprecated_blue" variant="caption">
            {selectedSession.dapp.url}
          </Text>
        </Flex>
        <Flex gap="none" width="100%">
          {activeChains.map((chainId) => {
            const info = CHAIN_INFO[chainId]
            return (
              <Button
                key={chainId}
                name={`${ElementName.NetworkButton}-${chainId}`}
                onPress={() => {
                  selectionAsync()
                  changeChainId(selectedSession.id, chainId, activeAccountAddress)
                  onClose()
                }}>
                <Separator />
                <Flex row alignItems="center" justifyContent="space-between" px="lg" py="md">
                  <NetworkLogo chainId={chainId} size={24} />
                  <Text color="neutralTextPrimary" variant="subHead1">
                    {info.label}
                  </Text>
                  <Box height={24} width={24}>
                    {chainId === toSupportedChainId(selectedSession.dapp.chain_id) && (
                      <Check color={theme.colors.neutralTextSecondary} height={24} width={24} />
                    )}
                  </Box>
                </Flex>
              </Button>
            )
          })}
          <Button
            onPress={() => {
              notificationAsync()
              disconnectFromApp(selectedSession.id, activeAccountAddress)
              onClose()
            }}>
            <Separator />
            <Flex centered row px="lg" py="md">
              <Text color="accentBackgroundFailure" variant="subHead1">
                {t('Disconnect')}
              </Text>
            </Flex>
          </Button>
        </Flex>
      </Flex>
      <Button
        onPress={() => {
          selectionAsync()
          onClose()
        }}>
        <Flex centered bg="neutralSurface" borderRadius="lg" mt="md" py="md">
          <Text color="neutralTextPrimary" variant="subHead1">
            {t('Cancel')}
          </Text>
        </Flex>
      </Button>
    </BottomSheetDetachedModal>
  )
}
