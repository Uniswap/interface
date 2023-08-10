import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import { Box, Flex } from 'src/components/layout'
import { Separator } from 'src/components/layout/Separator'
import { ActionSheetModal } from 'src/components/modals/ActionSheetModal'
import { Text } from 'src/components/Text'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import Check from 'ui/src/assets/icons/check.svg'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { NetworkLogo } from 'wallet/src/components/CurrencyLogo/NetworkLogo'
import { ChainId, CHAIN_INFO } from 'wallet/src/constants/chains'
import { useActiveChainIds } from 'wallet/src/features/chains/hooks'

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
  const activeChains = useActiveChainIds()
  const theme = useAppTheme()
  const { t } = useTranslation()

  const options = useMemo(
    () =>
      activeChains.map((chainId) => {
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
                px="spacing24"
                py="spacing16">
                <NetworkLogo chainId={chainId} size={iconSizes.icon24} />
                <Text color="neutral1" variant="bodyLarge">
                  {info.label}
                </Text>
                <Box height={24} width={24}>
                  {chainId === selectedChainId && (
                    <Check color={theme.colors.accent1} height={24} width={24} />
                  )}
                </Box>
              </Flex>
            </>
          ),
        }
      }),
    [activeChains, selectedChainId, onPressChain, theme.colors.accent1]
  )

  return (
    <ActionSheetModal
      header={
        <Flex centered gap="spacing4" py="spacing16">
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
