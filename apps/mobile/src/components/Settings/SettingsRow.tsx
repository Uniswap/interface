import { NavigatorScreenParams } from '@react-navigation/core'
import React from 'react'
import { ValueOf } from 'react-native-gesture-handler/lib/typescript/typeUtils'
import {
  OnboardingStackNavigationProp,
  OnboardingStackParamList,
  SettingsStackNavigationProp,
  SettingsStackParamList,
} from 'src/app/navigation/types'
import { Arrow } from 'src/components/icons/Arrow'
import { openModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { Screens } from 'src/screens/Screens'
import { openUri } from 'src/utils/linking'
import { Flex, Icons, Text, TouchableArea, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { useAppDispatch } from 'wallet/src/state'

export interface SettingsSection {
  subTitle: string
  data: (SettingsSectionItem | SettingsSectionItemComponent)[]
  isHidden?: boolean
}

export interface SettingsSectionItemComponent {
  component: JSX.Element
  isHidden?: boolean
}

type SettingsModal = Extract<ModalName, ModalName.FiatCurrencySelector>
export interface SettingsSectionItem {
  screen?: keyof SettingsStackParamList | typeof Screens.OnboardingStack
  modal?: SettingsModal
  screenProps?: ValueOf<SettingsStackParamList> | NavigatorScreenParams<OnboardingStackParamList>
  externalLink?: string
  action?: JSX.Element
  text: string
  subText?: string
  icon: JSX.Element
  isHidden?: boolean
  currentSetting?: string
}

interface SettingsRowProps {
  page: SettingsSectionItem
  navigation: SettingsStackNavigationProp & OnboardingStackNavigationProp
}

export function SettingsRow({
  page: { screen, modal, screenProps, externalLink, action, icon, text, subText, currentSetting },
  navigation,
}: SettingsRowProps): JSX.Element {
  const colors = useSporeColors()
  const dispatch = useAppDispatch()

  const handleRow = async (): Promise<void> => {
    if (screen) {
      navigation.navigate(screen, screenProps)
    } else if (modal) {
      dispatch(openModal({ name: modal }))
    } else if (externalLink) {
      await openUri(externalLink)
    }
  }
  return (
    <TouchableArea disabled={Boolean(action)} onPress={handleRow}>
      <Flex grow row alignItems="center" gap="$spacing16" minHeight={40}>
        <Flex
          grow
          row
          alignItems={subText ? 'flex-start' : 'center'}
          flexBasis={0}
          gap="$spacing12">
          <Flex centered height={32} width={32}>
            {icon}
          </Flex>
          <Flex fill grow alignItems="stretch">
            <Text numberOfLines={1} variant="body1">
              {text}
            </Text>
            {subText && (
              <Text color="$neutral2" numberOfLines={1} variant="buttonLabel4">
                {subText}
              </Text>
            )}
          </Flex>
        </Flex>
        {screen || modal ? (
          <Flex centered row>
            {currentSetting ? (
              <Flex row shrink alignItems="flex-end" flexBasis="30%" justifyContent="flex-end">
                <Text
                  adjustsFontSizeToFit
                  color="$neutral2"
                  mr="$spacing8"
                  numberOfLines={1}
                  variant="body3">
                  {currentSetting}
                </Text>
              </Flex>
            ) : null}
            <Icons.RotatableChevron
              color="$neutral3"
              direction="end"
              height={iconSizes.icon24}
              width={iconSizes.icon24}
            />
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
