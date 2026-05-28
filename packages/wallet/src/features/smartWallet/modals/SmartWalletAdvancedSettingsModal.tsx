import { ReactNode, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, IconProps, Switch, Text, TouchableArea, useSporeColors } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { SmartWallet } from 'ui/src/components/icons/SmartWallet'
import { Wrench } from 'ui/src/components/icons/Wrench'
import { iconSizes } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { isMobileApp } from 'utilities/src/platform'

const iconProps: IconProps = {
  color: '$neutral2',
  size: '$icon.24',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

type SmartWalletAdvancedSettingsModalProps = {
  isOpen: boolean
  isTestnetEnabled?: boolean
  onTestnetModeToggled?: (isChecked: boolean) => void
  onPressSmartWallet?: () => void
  onClose: () => void
}

export type SmartWalletAdvancedSettingsModalState = Omit<SmartWalletAdvancedSettingsModalProps, 'onClose' | 'isOpen'>

export function SmartWalletAdvancedSettingsModal({
  isOpen,
  isTestnetEnabled = false,
  onTestnetModeToggled,
  onPressSmartWallet,
  onClose,
}: SmartWalletAdvancedSettingsModalProps): JSX.Element {
  const { t } = useTranslation()

  const toggleSmartWalletMode = useCallback(() => {
    onClose()
    onPressSmartWallet?.()
  }, [onClose, onPressSmartWallet])

  return (
    <Modal name={ModalName.SmartWalletAdvancedSettingsModal} isModalOpen={isOpen} onClose={onClose}>
      <Flex animation="fast" gap="$gap8" p="$spacing4" mb={isMobileApp ? '$spacing36' : undefined} width="100%">
        <Text textAlign="center" color="$neutral1" variant="subheading1">
          {t('settings.setting.advancedSettings')}
        </Text>
        <AdvancedSettingsOptions
          active={isTestnetEnabled}
          icon={<Wrench {...iconProps} />}
          title={t('settings.setting.wallet.testnetMode.title')}
          onCheckedChange={onTestnetModeToggled}
        />
        <AdvancedSettingsOptions
          icon={<SmartWallet {...iconProps} />}
          title={t('settings.setting.smartWallet.action.smartWallet')}
          onPress={toggleSmartWalletMode}
        />
        <Flex />
      </Flex>
    </Modal>
  )
}

interface AdvancedSettingsOptionsProps {
  icon: ReactNode
  active?: boolean
  title: string
  onCheckedChange?: (isChecked: boolean) => void
  onPress?: () => void
}

function AdvancedSettingsOptions({
  icon,
  active,
  title,
  onCheckedChange,
  onPress,
}: AdvancedSettingsOptionsProps): JSX.Element {
  const colors = useSporeColors()

  return (
    <TouchableArea
      alignItems="center"
      borderRadius="$rounded12"
      flexDirection="row"
      flexGrow={1}
      gap="$spacing12"
      hoverStyle={{ backgroundColor: '$surface2' }}
      justifyContent="space-between"
      px="$spacing12"
      py="$spacing8"
      onPress={onPress}
    >
      <Flex row justifyContent="space-between" alignItems="center">
        <Flex row gap="$spacing12">
          {icon}
          <Text alignSelf="center" style={{ color: colors.neutral1.val }} variant="subheading2">
            {title}
          </Text>
        </Flex>
      </Flex>

      {onCheckedChange ? (
        <Switch
          checked={active ?? false}
          variant="branded"
          onCheckedChange={(isChecked: boolean) => {
            onCheckedChange(isChecked)
          }}
        />
      ) : (
        <RotatableChevron color="$neutral3" direction="right" height={iconSizes.icon24} width={iconSizes.icon24} />
      )}
    </TouchableArea>
  )
}
