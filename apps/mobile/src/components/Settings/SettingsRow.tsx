import { NavigatorScreenParams } from '@react-navigation/core'
import React from 'react'
import { ValueOf } from 'react-native-gesture-handler/lib/typescript/typeUtils'
import { useDispatch } from 'react-redux'
import {
  OnboardingStackNavigationProp,
  OnboardingStackParamList,
  SettingsStackNavigationProp,
  SettingsStackParamList,
} from 'src/app/navigation/types'
import { openModal } from 'src/features/modals/modalSlice'
import { Flex, Switch, Text, TouchableArea, useSporeColors } from 'ui/src'
import { Arrow } from 'ui/src/components/arrow/Arrow'
import { RotatableChevron } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { openUri } from 'uniswap/src/utils/linking'

export interface SettingsSection {
  subTitle: string
  data: (SettingsSectionItem | SettingsSectionItemComponent)[]
  isHidden?: boolean
}

export interface SettingsSectionItemComponent {
  component: JSX.Element
  isHidden?: boolean
}
type SettingsModal = typeof ModalName.FiatCurrencySelector | typeof ModalName.LanguageSelector

export interface SettingsSectionItem {
  screen?: keyof SettingsStackParamList | typeof MobileScreens.OnboardingStack
  modal?: SettingsModal
  screenProps?: ValueOf<SettingsStackParamList> | NavigatorScreenParams<OnboardingStackParamList>
  externalLink?: string
  action?: JSX.Element
  text: string
  subText?: string
  icon: JSX.Element
  isHidden?: boolean
  currentSetting?: string
  onToggle?: () => void
  isToggleEnabled?: boolean
}

interface SettingsRowProps {
  page: SettingsSectionItem
  navigation: SettingsStackNavigationProp & OnboardingStackNavigationProp
}

export function SettingsRow({
  page: {
    screen,
    modal,
    screenProps,
    externalLink,
    action,
    icon,
    text,
    subText,
    currentSetting,
    onToggle,
    isToggleEnabled,
  },
  navigation,
}: SettingsRowProps): JSX.Element {
  const colors = useSporeColors()
  const dispatch = useDispatch()

  const handleRow = async (): Promise<void> => {
    if (onToggle) {
      return
    } else if (screen) {
      navigation.navigate(screen, screenProps)
    } else if (modal) {
      dispatch(openModal({ name: modal }))
    } else if (externalLink) {
      await openUri(externalLink)
    }
  }

  if (onToggle && isToggleEnabled === undefined) {
    throw new Error('Should pass valid isToggleEnabled prop when onToggle is passed')
  }

  return (
    <TouchableArea disabled={Boolean(action)} onPress={handleRow}>
      <Flex grow row alignItems="center" gap="$spacing16" minHeight={40}>
        <Flex grow row alignItems={subText ? 'flex-start' : 'center'} flexBasis={0} gap="$spacing12">
          <Flex centered height={32} width={32}>
            {icon}
          </Flex>
          <Flex fill grow alignItems="stretch">
            <Text numberOfLines={1} variant="body1">
              {text}
            </Text>
            {subText && (
              <Text color="$neutral2" numberOfLines={1} variant="buttonLabel2">
                {subText}
              </Text>
            )}
          </Flex>
        </Flex>
        {onToggle && typeof isToggleEnabled === 'boolean' ? (
          <Switch checked={isToggleEnabled} variant="branded" onCheckedChange={onToggle} />
        ) : screen || modal ? (
          <Flex centered row>
            {currentSetting ? (
              <Flex row shrink alignItems="flex-end" flexBasis="30%" justifyContent="flex-end">
                <Text adjustsFontSizeToFit color="$neutral2" mr="$spacing8" numberOfLines={1} variant="body3">
                  {currentSetting}
                </Text>
              </Flex>
            ) : null}
            <RotatableChevron color="$neutral3" direction="end" height={iconSizes.icon24} width={iconSizes.icon24} />
          </Flex>
        ) : externalLink ? (
          <Arrow color={colors.neutral3.val} direction="ne" size={iconSizes.icon24} />
        ) : (
          action
        )}
      </Flex>
    </TouchableArea>
  )
}
