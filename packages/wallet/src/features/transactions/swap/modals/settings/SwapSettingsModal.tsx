import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, TouchableArea, isWeb, useSporeColors } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { SwapFormContext, useSwapFormContext } from 'wallet/src/features/transactions/contexts/SwapFormContext'
import { SwapSettingRow } from 'wallet/src/features/transactions/swap/modals/settings/SwapSettingsRow'
import { ProtocolPreference } from 'wallet/src/features/transactions/swap/modals/settings/configs/ProtocolPreference'
import { Slippage } from 'wallet/src/features/transactions/swap/modals/settings/configs/Slippage'
import { SwapSettingConfig } from 'wallet/src/features/transactions/swap/modals/settings/configs/types'

export type SwapSettingsModalProps = {
  customSettings: SwapSettingConfig[]
  onClose?: () => void
  isOpen: boolean
}

export function SwapSettingsModal({ onClose, isOpen, customSettings }: SwapSettingsModalProps): JSX.Element {
  const swapFormContext = useSwapFormContext()
  const colors = useSporeColors()
  const { t } = useTranslation()
  const allSettings = useMemo(() => [Slippage, ...customSettings, ProtocolPreference], [customSettings])

  const [SelectedSetting, setSelectedSetting] = useState<SwapSettingConfig>()

  const title = SelectedSetting ? SelectedSetting.renderTitle(t) : t('swap.settings.title')
  const screen = SelectedSetting?.Screen ? (
    <SelectedSetting.Screen />
  ) : (
    <Flex gap="$spacing16" py="$spacing12">
      {allSettings.map((setting, index) => (
        <SwapSettingRow
          key={`swap-setting-${index}`}
          index={index}
          setSelectedSetting={setSelectedSetting}
          setting={setting}
        />
      ))}
    </Flex>
  )

  return (
    <Modal
      alignment={isWeb ? 'top' : undefined}
      backgroundColor={colors.surface1.val}
      isModalOpen={isOpen}
      name={ModalName.SwapSettings}
      onClose={onClose}
    >
      {/* Re-create the SwapFormContextProvider, since Modal can cause its children to be in a separate component tree. */}
      <SwapFormContext.Provider value={swapFormContext}>
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
      </SwapFormContext.Provider>
    </Modal>
  )
}
