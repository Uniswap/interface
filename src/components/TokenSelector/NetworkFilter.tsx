import { selectionAsync } from 'expo-haptics'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import Check from 'src/assets/icons/check.svg'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { Chevron } from 'src/components/icons/Chevron'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { Separator } from 'src/components/layout/Separator'
import { ActionSheetModal } from 'src/components/modals/ActionSheetModal'
import { useNetworkOptions } from 'src/components/Network/hooks'
import { Text } from 'src/components/Text'
import { ChainId, CHAIN_INFO } from 'src/constants/chains'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { iconSizes } from 'src/styles/sizing'

interface NetworkFilterProps {
  selectedChain: ChainId | null
  onPressChain: (chainId: ChainId | null) => void
}

export function NetworkFilter({ selectedChain, onPressChain }: NetworkFilterProps): JSX.Element {
  const theme = useAppTheme()
  const { t } = useTranslation()
  const [showModal, setShowModal] = useState(false)

  const onPress = useCallback(
    (chainId: ChainId | null) => {
      selectionAsync()
      setShowModal(false)
      onPressChain(chainId)
    },
    [setShowModal, onPressChain]
  )

  const networkOptions = useNetworkOptions(selectedChain, onPress)

  const options = useMemo(
    () =>
      [
        {
          key: `${ElementName.NetworkButton}-all`,
          onPress: (): void => {
            setShowModal(false)
            onPressChain(null)
          },
          render: () => (
            <>
              <Separator />
              <Flex
                row
                alignItems="center"
                justifyContent="space-between"
                px="spacing24"
                py="spacing16">
                <Box height={iconSizes.icon24} width={iconSizes.icon24} />
                <Text color="textPrimary" variant="bodyLarge">
                  {t('All networks')}
                </Text>
                <Box height={iconSizes.icon24} width={iconSizes.icon24}>
                  {!selectedChain && (
                    <Check
                      color={theme.colors.accentActive}
                      height={iconSizes.icon24}
                      width={iconSizes.icon24}
                    />
                  )}
                </Box>
              </Flex>
            </>
          ),
        },
      ].concat(...networkOptions),
    [networkOptions, onPressChain, selectedChain, t, theme.colors.accentActive]
  )

  return (
    <>
      <TouchableArea
        py="spacing8"
        onPress={(): void => {
          Keyboard.dismiss()
          setShowModal(true)
        }}>
        <Flex centered row bg="background2" borderRadius="rounded20" gap="spacing4" p="spacing8">
          {selectedChain && <NetworkLogo chainId={selectedChain} size={iconSizes.icon16} />}
          <Text color="textSecondary" pl="spacing2" textAlign="center" variant="buttonLabelSmall">
            {selectedChain ? CHAIN_INFO[selectedChain].label : t('All networks')}
          </Text>
          <Chevron color={theme.colors.textSecondary} direction="s" height={16} width={16} />
        </Flex>
      </TouchableArea>

      <ActionSheetModal
        header={
          <Flex centered gap="spacing4" py="spacing16">
            <Text variant="buttonLabelMedium">{t('Switch Network')}</Text>
          </Flex>
        }
        isVisible={showModal}
        name={ModalName.NetworkSelector}
        options={options}
        onClose={(): void => setShowModal(false)}
      />
    </>
  )
}
