import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import { Separator } from 'src/components/layout/Separator'
import { ActionSheetModal } from 'src/components/modals/ActionSheetModal'
import { Text } from 'src/components/Text'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { Flex } from 'ui/src'
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
  const theme = useAppTheme()
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
                <Text color="neutral1" variant="bodyLarge">
                  {info.label}
                </Text>
                <Flex gap="$none" height={24} width={24}>
                  {chainId === selectedChainId && (
                    <Check color={theme.colors.accent1} height={24} width={24} />
                  )}
                </Flex>
              </Flex>
            </>
          ),
        }
      }),
    [selectedChainId, onPressChain, theme.colors.accent1]
  )

  return (
    <ActionSheetModal
      header={
        <Flex centered gap="$spacing4" py="$spacing16">
          <Text variant="buttonLabelMedium">{t('Switch Network')}</Text>
        </Flex>
      }
      isVisible={true}
      name={ModalName.NetworkSelector}
      options={options}
      onClose={onClose}
    />
  )
}
