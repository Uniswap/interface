import { Action } from '@reduxjs/toolkit'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { SvgProps } from 'react-native-svg'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Flex } from 'src/components/layout'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import Check from 'ui/src/assets/icons/check.svg'
import ContrastIcon from 'ui/src/assets/icons/contrast.svg'
import MoonIcon from 'ui/src/assets/icons/moon.svg'
import SunIcon from 'ui/src/assets/icons/sun.svg'
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
      <BackHeader alignment="center" mx="spacing16" pt="spacing16">
        <Text variant="bodyLarge">{t('Appearance')}</Text>
      </BackHeader>
      <Box p="spacing24">
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
      </Box>
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
  const theme = useAppTheme()
  const dispatch = useAppDispatch()

  return (
    <TouchableArea
      alignItems="center"
      flexDirection="row"
      justifyContent="space-between"
      py="spacing12"
      onPress={(): Action => dispatch(setSelectedAppearanceSettings(option))}>
      <Icon
        color={theme.colors.neutral2}
        height={theme.iconSizes.icon24}
        strokeWidth={1.5}
        width={theme.iconSizes.icon24}
      />
      <Flex gap="none" ml="spacing16">
        <Text variant="bodyLarge">{title}</Text>
        <Text color="neutral2" pr="spacing12" variant="bodySmall">
          {subtitle}
        </Text>
      </Flex>
      <Flex grow alignItems="flex-end">
        {active ? (
          <Flex row alignItems="center" gap="spacing4">
            <Check
              color={theme.colors.accent1}
              height={theme.iconSizes.icon24}
              width={theme.iconSizes.icon24}
            />
          </Flex>
        ) : null}
      </Flex>
    </TouchableArea>
  )
}
