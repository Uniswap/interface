import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Separator, Text, useSporeColors } from 'ui/src'
import Check from 'ui/src/assets/icons/check.svg'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { ActionSheetModal } from 'uniswap/src/components/modals/ActionSheetModal'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { WALLET_SUPPORTED_CHAIN_IDS, WalletChainId } from 'uniswap/src/types/chains'

type Props = {
  selectedChainId: WalletChainId
  onPressChain: (chainId: WalletChainId) => void
  onClose: () => void
}

export const PendingConnectionSwitchNetworkModal = ({ selectedChainId, onPressChain, onClose }: Props): JSX.Element => {
  const colors = useSporeColors()
  const { t } = useTranslation()

  const options = useMemo(
    () =>
      WALLET_SUPPORTED_CHAIN_IDS.map((chainId) => {
        const info = UNIVERSE_CHAIN_INFO[chainId]
        return {
          key: `${ElementName.NetworkButton}-${chainId}`,
          onPress: () => onPressChain(chainId),
          render: () => (
            <>
              <Separator />
              <Flex row alignItems="center" justifyContent="space-between" px="$spacing24" py="$spacing16">
                <NetworkLogo chainId={chainId} size={iconSizes.icon24} />
                <Text color="$neutral1" variant="body1">
                  {info.label}
                </Text>
                <Flex height={iconSizes.icon24} width={iconSizes.icon24}>
                  {chainId === selectedChainId && (
                    <Check color={colors.accent1.get()} height={iconSizes.icon24} width={iconSizes.icon24} />
                  )}
                </Flex>
              </Flex>
            </>
          ),
        }
      }),
    [selectedChainId, onPressChain, colors.accent1],
  )

  return (
    <ActionSheetModal
      header={
        <Flex centered gap="$spacing4" py="$spacing16">
          <Text variant="buttonLabel2">{t('walletConnect.pending.switchNetwork')}</Text>
        </Flex>
      }
      isVisible={true}
      name={ModalName.NetworkSelector}
      options={options}
      onClose={onClose}
    />
  )
}
