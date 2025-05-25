import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { SCREEN_ITEM_HORIZONTAL_PAD } from 'src/app/constants'
import { Flex, SegmentedControl, Text } from 'ui/src'
import { Contrast, Moon, Sun } from 'ui/src/components/icons'
import { useCurrentAppearanceSetting } from 'wallet/src/features/appearance/hooks'
import { AppearanceSettingType, setSelectedAppearanceSettings } from 'wallet/src/features/appearance/slice'

export default function ThemeToggle(): JSX.Element {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const currentAppearanceSetting = useCurrentAppearanceSetting()

  const defaultOptions = [
    {
      value: AppearanceSettingType.System,
      display: (
        <Text variant="buttonLabel4" color="$neutral1">
          {t('settings.setting.appearance.option.auto')}
        </Text>
      ),
    },
    {
      value: AppearanceSettingType.Light,
      display: <Sun size="$icon.20" color="$neutral2" />,
    },
    {
      value: AppearanceSettingType.Dark,
      display: <Moon size="$icon.20" color="$neutral2" />,
    },
  ]
  const switchMode = useCallback(
    (mode: AppearanceSettingType) => dispatch(setSelectedAppearanceSettings(mode)),
    [dispatch],
  )

  return (
    <Flex
      alignItems="center"
      flexDirection="row"
      gap="$spacing16"
      justifyContent="space-between"
      px={SCREEN_ITEM_HORIZONTAL_PAD}
      py="$spacing4"
    >
      <Flex row gap="$spacing12">
        <Contrast color="$neutral2" size="$icon.24" />
        <Text>{t('settings.setting.appearance.title')}</Text>
      </Flex>
      <Flex>
        <SegmentedControl
          options={defaultOptions}
          selectedOption={currentAppearanceSetting}
          onSelectOption={switchMode}
        />
      </Flex>
    </Flex>
  )
}
