import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Popover, Text, TouchableArea, isWeb, useSporeColors } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { iconSizes } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { SwapFormContext, useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { SwapSettingRow } from 'uniswap/src/features/transactions/swap/settings/SwapSettingsRow'
import { SwapSettingConfig } from 'uniswap/src/features/transactions/swap/settings/configs/types'
import {
  SwapSettingsContext,
  useSwapSettingsContext,
} from 'uniswap/src/features/transactions/swap/settings/contexts/SwapSettingsContext'
import { isExtension, isInterface } from 'utilities/src/platform'

const POPOVER_WIDTH = 320

export type SwapSettingsModalProps = {
  settings: SwapSettingConfig[]
  defaultTitle?: string
  onClose?: () => void
  isOpen: boolean
}

const SwapSettingsModalContent = ({
  settings,
  defaultTitle,
  onClose,
}: Omit<SwapSettingsModalProps, 'isOpen'>): JSX.Element => {
  const { t } = useTranslation()
  const [SelectedSetting, setSelectedSetting] = useState<SwapSettingConfig>()

  const title = SelectedSetting ? SelectedSetting.renderTitle(t) : defaultTitle ?? t('swap.settings.title')
  const screen = SelectedSetting?.Screen ? (
    <SelectedSetting.Screen />
  ) : (
    <Flex gap="$spacing16" py="$spacing12">
      {settings.map((setting, index) => (
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

function SwapSettingsModalInterface({ settings, defaultTitle, onClose }: SwapSettingsModalProps): JSX.Element {
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
      <SwapSettingsModalContent defaultTitle={defaultTitle} settings={settings} onClose={onClose} />
    </Popover.Content>
  )
}

function SwapSettingsModalWallet({ settings, onClose, isOpen }: SwapSettingsModalProps): JSX.Element {
  const swapFormContext = useSwapFormContext()
  const swapSettingsContext = useSwapSettingsContext()
  const colors = useSporeColors()

  return (
    <Modal
      alignment={isExtension ? 'top' : undefined}
      backgroundColor={colors.surface1.val}
      isModalOpen={isOpen}
      name={ModalName.SwapSettings}
      onClose={onClose}
    >
      {/* Re-create the SwapSettingsContextProvider, since native Modal can cause its children to be in a separate component tree. */}
      <SwapSettingsContext.Provider value={swapSettingsContext}>
        {/* Re-create the SwapFormContextProvider, since native Modal can cause its children to be in a separate component tree. */}
        <SwapFormContext.Provider value={swapFormContext}>
          <SwapSettingsModalContent settings={settings} onClose={onClose} />
        </SwapFormContext.Provider>
      </SwapSettingsContext.Provider>
    </Modal>
  )
}

export function SwapSettingsModal(props: SwapSettingsModalProps): JSX.Element {
  if (isInterface) {
    return <SwapSettingsModalInterface {...props} />
  }

  return <SwapSettingsModalWallet {...props} />
}
