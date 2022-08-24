import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import Check from 'src/assets/icons/check.svg'
import { Button } from 'src/components/buttons/Button'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { Chevron } from 'src/components/icons/Chevron'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { Separator } from 'src/components/layout/Separator'
import { ActionSheetModal } from 'src/components/modals/ActionSheetModal'
import { Text } from 'src/components/Text'
import { ChainId, CHAIN_INFO } from 'src/constants/chains'
import { useActiveChainIds } from 'src/features/chains/utils'
import { ElementName, ModalName } from 'src/features/telemetry/constants'

interface NetworkFilterProps {
  selectedChain: ChainId | null
  onPressChain: (chainId: ChainId | null) => void
}

export function NetworkFilter({ selectedChain, onPressChain }: NetworkFilterProps) {
  const theme = useAppTheme()
  const activeChains = useActiveChainIds()

  const { t } = useTranslation()
  const [showModal, setShowModal] = useState(false)

  const options = useMemo(
    () =>
      [
        {
          key: `${ElementName.NetworkButton}-all`,
          onPress: () => {
            setShowModal(false)
            onPressChain(null)
          },
          render: () => (
            <>
              <Separator />
              <Flex row alignItems="center" justifyContent="space-between" px="lg" py="md">
                <Box height={24} width={24} />
                <Text color="textPrimary" variant="body">
                  {t('All networks')}
                </Text>
                <Box height={24} width={24}>
                  {!selectedChain && (
                    <Check color={theme.colors.accentActive} height={24} width={24} />
                  )}
                </Box>
              </Flex>
            </>
          ),
        },
      ].concat(
        activeChains.map((chainId) => {
          const info = CHAIN_INFO[chainId]
          return {
            key: `${ElementName.NetworkButton}-${chainId}`,
            onPress: () => {
              setShowModal(false)
              onPressChain(chainId)
            },
            render: () => (
              <>
                <Separator />
                <Flex row alignItems="center" justifyContent="space-between" px="lg" py="md">
                  <NetworkLogo chainId={chainId} size={24} />
                  <Text color="textPrimary" variant="body">
                    {info.label}
                  </Text>
                  <Box height={24} width={24}>
                    {selectedChain === chainId && (
                      <Check color={theme.colors.accentActive} height={24} width={24} />
                    )}
                  </Box>
                </Flex>
              </>
            ),
          }
        })
      ),
    [activeChains, onPressChain, selectedChain, t, theme.colors.accentActive]
  )

  return (
    <>
      <Button
        py="xs"
        onPress={() => {
          Keyboard.dismiss()
          setShowModal(true)
        }}>
        <Flex centered row bg="backgroundContainer" borderRadius="sm" gap="xxs" p="xs">
          {selectedChain && <NetworkLogo chainId={selectedChain} size={16} />}
          <Text color="textSecondary" pl="xxxs" textAlign="center" variant="smallLabel">
            {selectedChain ? CHAIN_INFO[selectedChain].label : t('All networks')}
          </Text>
          <Chevron color={theme.colors.textSecondary} direction="s" height={16} width={16} />
        </Flex>
      </Button>

      <ActionSheetModal
        header={
          <Flex centered gap="xxs" py="md">
            <Text variant="mediumLabel">{t('Switch Network')}</Text>
          </Flex>
        }
        isVisible={showModal}
        name={ModalName.NetworkSelector}
        options={options}
        onClose={() => setShowModal(false)}
      />
    </>
  )
}
