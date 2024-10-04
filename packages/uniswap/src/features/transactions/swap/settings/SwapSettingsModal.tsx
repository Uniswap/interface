import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Popover, Text, TouchableArea, isWeb, useSporeColors } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { iconSizes } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { SwapFormContext, useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { SwapSettingRow } from 'uniswap/src/features/transactions/swap/settings/SwapSettingsRow'
import { ProtocolPreference } from 'uniswap/src/features/transactions/swap/settings/configs/ProtocolPreference'
import { Slippage } from 'uniswap/src/features/transactions/swap/settings/configs/Slippage'
import { SwapSettingConfig } from 'uniswap/src/features/transactions/swap/settings/configs/types'
import { isExtension, isInterface } from 'utilities/src/platform'

const POPOVER_WIDTH = 320

export type SwapSettingsModalProps = {
  customSettings: SwapSettingConfig[]
  onClose?: () => void
  isOpen: boolean
}

const SwapSettingsModalContent = ({ customSettings, onClose }: Omit<SwapSettingsModalProps, 'isOpen'>): JSX.Element => {
  const { t } = useTranslation()
  const allSettings = useMemo(() => [Slippage, ...customSettings, ProtocolPreference], [customSettings])
  const [SelectedSetting, setSelectedSetting] = useState<SwapSettingConfig>()

  const title = SelectedSetting ? SelectedSetting.renderTitle(t) : t('swap.settings.title')
  const screen = SelectedSetting?.Screen ? (
    <SelectedSetting.Screen />
  ) : (
    <Flex gap="$spacing16" py="$spacing12">
      {allSettings.map((setting, index) => (
        <SwapSettingRow key={`swap-setting-${index}`} setSelectedSetting={setSelectedSetting} setting={setting} />
      ))}
    </Flex>
  )

  return (
    <Flex gap="$spacing16" px={isWeb ? '$spacing4' : '$spacing24'} py={isWeb ? '$spacing4' : '$spacing12'}>
      <Flex row justifyContent="space-between">
        <TouchableArea onPress={(): void => setSelectedSetting(undefined)}>
          <RotatableChevron
            color={SelectedSetting === undefined ? '$transparent' : '$neutral3'}
            height={iconSizes.icon24}
            width={iconSizes.icon24}
          />
        </TouchableArea>
        <Text textAlign="center" variant="body1">
          {title}
        </Text>
        <Flex width={iconSizes.icon24} />
      </Flex>
      {screen}
      <Flex centered row>
        <Button fill testID="swap-settings-close" theme="secondary" onPress={onClose}>
          {t('common.button.close')}
        </Button>
      </Flex>
    </Flex>
  )
}

export function SwapSettingsModal({ onClose, isOpen, customSettings }: SwapSettingsModalProps): JSX.Element {
  const swapFormContext = useSwapFormContext()
  const colors = useSporeColors()

  if (isInterface) {
    return (
      <Popover.Content
        animation={[
          'quick',
          {
            opacity: {
              overshootClamping: true,
            },
          },
        ]}
        borderColor="$surface3"
        borderRadius="$rounded24"
        borderWidth="$spacing1"
        enterStyle={{ y: -10, opacity: 0 }}
        exitStyle={{ y: -10, opacity: 0 }}
        p="$spacing12"
        shadowColor="$shadowColor"
        shadowOpacity={0.06}
        shadowRadius={6}
        width={POPOVER_WIDTH}
      >
        <SwapSettingsModalContent customSettings={customSettings} onClose={onClose} />
      </Popover.Content>
    )
  }

  return (
    <Modal
      alignment={isExtension ? 'top' : undefined}
      backgroundColor={colors.surface1.val}
      isModalOpen={isOpen}
      name={ModalName.SwapSettings}
      onClose={onClose}
    >
      {/* Re-create the SwapFormContextProvider, since native Modal can cause its children to be in a separate component tree. */}
      <SwapFormContext.Provider value={swapFormContext}>
        <SwapSettingsModalContent customSettings={customSettings} onClose={onClose} />
      </SwapFormContext.Provider>
    </Modal>
  )
}
