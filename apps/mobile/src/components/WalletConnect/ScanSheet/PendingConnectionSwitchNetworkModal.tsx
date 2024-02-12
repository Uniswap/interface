import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ActionSheetModal } from 'src/components/modals/ActionSheetModal'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { Flex, Separator, Text, useSporeColors } from 'ui/src'
import Check from 'ui/src/assets/icons/check.svg'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'wallet/src/components/CurrencyLogo/NetworkLogo'
import { ALL_SUPPORTED_CHAIN_IDS, ChainId, CHAIN_INFO } from 'wallet/src/constants/chains'

type Props = {
  selectedChainId: ChainId
  onPressChain: (chainId: ChainId) => void
  onClose: () => void
}

export const PendingConnectionSwitchNetworkModal = ({
  selectedChainId,
  onPressChain,
  onClose,
}: Props): JSX.Element => {
  const colors = useSporeColors()
  const { t } = useTranslation()

  const options = useMemo(
    () =>
      ALL_SUPPORTED_CHAIN_IDS.map((chainId) => {
        const info = CHAIN_INFO[chainId]
        return {
          key: `${ElementName.NetworkButton}-${chainId}`,
          onPress: () => onPressChain(chainId),
          render: () => (
            <>
              <Separator />
              <Flex
                row
                alignItems="center"
                justifyContent="space-between"
                px="$spacing24"
                py="$spacing16">
                <NetworkLogo chainId={chainId} size={iconSizes.icon24} />
                <Text color="$neutral1" variant="body1">
                  {info.label}
                </Text>
                <Flex height={iconSizes.icon24} width={iconSizes.icon24}>
                  {chainId === selectedChainId && (
                    <Check
                      color={colors.accent1.get()}
                      height={iconSizes.icon24}
                      width={iconSizes.icon24}
                    />
                  )}
                </Flex>
              </Flex>
            </>
          ),
        }
      }),
    [selectedChainId, onPressChain, colors.accent1]
  )

  return (
    <ActionSheetModal
      header={
        <Flex centered gap="$spacing4" py="$spacing16">
          <Text variant="buttonLabel2">{t('Switch Network')}</Text>
        </Flex>
      }
      isVisible={true}
      name={ModalName.NetworkSelector}
      options={options}
      onClose={onClose}
    />
  )
}
