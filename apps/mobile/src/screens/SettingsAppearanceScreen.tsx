import { Action } from '@reduxjs/toolkit'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { SvgProps } from 'react-native-svg'
import { useAppDispatch } from 'src/app/hooks'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Screen } from 'src/components/layout/Screen'
import { Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import Check from 'ui/src/assets/icons/check.svg'
import ContrastIcon from 'ui/src/assets/icons/contrast.svg'
import MoonIcon from 'ui/src/assets/icons/moon.svg'
import SunIcon from 'ui/src/assets/icons/sun.svg'
import { iconSizes } from 'ui/src/theme'
import { useCurrentAppearanceSetting } from 'wallet/src/features/appearance/hooks'
import {
  AppearanceSettingType,
  setSelectedAppearanceSettings,
} from 'wallet/src/features/appearance/slice'

export function SettingsAppearanceScreen(): JSX.Element {
  const { t } = useTranslation()
  const currentTheme = useCurrentAppearanceSetting()

  return (
    <Screen>
      <BackHeader alignment="center" mx="$spacing16" pt="$spacing16">
        <Text variant="body1">{t('Appearance')}</Text>
      </BackHeader>
      <Flex p="$spacing24">
        <AppearanceOption
          Icon={ContrastIcon}
          active={currentTheme === 'system'}
          option={AppearanceSettingType.System}
          subtitle={t('Default to your device’s appearance')}
          title={t('Device settings')}
        />
        <AppearanceOption
          Icon={SunIcon}
          active={currentTheme === 'light'}
          option={AppearanceSettingType.Light}
          subtitle={t('Always use light mode')}
          title={t('Light mode')}
        />
        <AppearanceOption
          Icon={MoonIcon}
          active={currentTheme === 'dark'}
          option={AppearanceSettingType.Dark}
          subtitle={t('Always use dark mode')}
          title={t('Dark mode')}
        />
      </Flex>
    </Screen>
  )
}

interface AppearanceOptionProps {
  active?: boolean
  title: string
  subtitle: string
  option: AppearanceSettingType
  Icon: React.FC<SvgProps>
}

function AppearanceOption({
  active,
  title,
  subtitle,
  Icon,
  option,
}: AppearanceOptionProps): JSX.Element {
  const colors = useSporeColors()
  const dispatch = useAppDispatch()

  const showCheckMark = active ? 1 : 0

  return (
    <TouchableArea
      alignItems="center"
      flexDirection="row"
      justifyContent="space-between"
      py="$spacing12"
      onPress={(): Action => dispatch(setSelectedAppearanceSettings(option))}>
      <Icon
        color={colors.neutral2.get()}
        height={iconSizes.icon24}
        strokeWidth={1.5}
        width={iconSizes.icon24}
      />
      <Flex row shrink>
        <Flex shrink ml="$spacing16">
          <Text variant="body1">{title}</Text>
          <Text color="$neutral2" pr="$spacing12" variant="body2">
            {subtitle}
          </Text>
        </Flex>
        <Flex grow alignItems="flex-end" justifyContent="center" style={{ opacity: showCheckMark }}>
          <Check color={colors.accent1.get()} height={iconSizes.icon24} width={iconSizes.icon24} />
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
