import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Flex, SegmentedControl, Text, useSporeColors } from 'ui/src'
import { Moon, Sun } from 'ui/src/components/icons'
import { useCurrentAppearanceSetting } from 'uniswap/src/features/appearance/hooks'
import { AppearanceSettingType, setSelectedAppearanceSettings } from 'uniswap/src/features/appearance/slice'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

export function ThemeToggle(): JSX.Element {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const currentAppearanceSetting = useCurrentAppearanceSetting()
  const colors = useSporeColors()

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
      display: (
        <Flex testID={TestID.ThemeLight}>
          {/* Use getter, as $neutral2 does not refresh color after changing theme */}
          <Sun size="$icon.20" color={colors.neutral2.get()} />
        </Flex>
      ),
    },
    {
      value: AppearanceSettingType.Dark,
      display: (
        <Flex testID={TestID.ThemeDark}>
          <Moon size="$icon.20" color={colors.neutral2.get()} />
        </Flex>
      ),
    },
  ]
  const switchMode = useCallback(
    (mode: AppearanceSettingType) => dispatch(setSelectedAppearanceSettings(mode)),
    [dispatch],
  )

  return (
    <SegmentedControl options={defaultOptions} selectedOption={currentAppearanceSetting} onSelectOption={switchMode} />
  )
}
