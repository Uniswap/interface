import { Action } from '@reduxjs/toolkit'
import { default as React } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { closeModal } from 'src/features/modals/modalSlice'
import { Flex, GeneratedIcon, Text, TouchableArea } from 'ui/src'
import { Check, Contrast, Moon, Sun } from 'ui/src/components/icons'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useCurrentAppearanceSetting } from 'wallet/src/features/appearance/hooks'
import { AppearanceSettingType, setSelectedAppearanceSettings } from 'wallet/src/features/appearance/slice'

export function SettingsAppearanceModal(): JSX.Element {
  const { t } = useTranslation()
  const currentTheme = useCurrentAppearanceSetting()
  const dispatch = useDispatch()

  return (
    <Modal
      name={ModalName.SettingsAppearance}
      onClose={(): Action => dispatch(closeModal({ name: ModalName.SettingsAppearance }))}
    >
      <Flex animation="fast" gap="$spacing16" pb="$spacing24" px="$spacing24" width="100%">
        <Flex centered>
          <Text color="$neutral1" variant="subheading1">
            {t('settings.setting.appearance.title')}
          </Text>
        </Flex>
        <Flex>
          <AppearanceOption
            Icon={Contrast}
            active={currentTheme === 'system'}
            option={AppearanceSettingType.System}
            subtitle={t('settings.setting.appearance.option.device.subtitle')}
            title={t('settings.setting.appearance.option.device.title')}
          />
          <AppearanceOption
            Icon={Sun}
            active={currentTheme === 'light'}
            option={AppearanceSettingType.Light}
            subtitle={t('settings.setting.appearance.option.light.subtitle')}
            title={t('settings.setting.appearance.option.light.title')}
          />
          <AppearanceOption
            Icon={Moon}
            active={currentTheme === 'dark'}
            option={AppearanceSettingType.Dark}
            subtitle={t('settings.setting.appearance.option.dark.subtitle')}
            title={t('settings.setting.appearance.option.dark.title')}
          />
        </Flex>
      </Flex>
    </Modal>
  )
}

interface AppearanceOptionProps {
  active?: boolean
  title: string
  subtitle: string
  option: AppearanceSettingType
  Icon: GeneratedIcon
}

function AppearanceOption({ active, title, subtitle, Icon, option }: AppearanceOptionProps): JSX.Element {
  const dispatch = useDispatch()

  const showCheckMarkOpacity = active ? 1 : 0

  return (
    <TouchableArea
      alignItems="center"
      flexDirection="row"
      justifyContent="space-between"
      py="$spacing12"
      onPress={(): Action => dispatch(setSelectedAppearanceSettings(option))}
    >
      <Icon color="$neutral2" size="$icon.24" strokeWidth={1.5} />
      <Flex row shrink>
        <Flex shrink ml="$spacing16">
          <Text color="$neutral1" variant="subheading2">
            {title}
          </Text>
          <Text color="$neutral2" pr="$spacing12" variant="body3">
            {subtitle}
          </Text>
        </Flex>
        <Flex grow alignItems="flex-end" justifyContent="center" style={{ opacity: showCheckMarkOpacity }}>
          <Check color="$accent1" size="$icon.24" strokeWidth={5} />
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
