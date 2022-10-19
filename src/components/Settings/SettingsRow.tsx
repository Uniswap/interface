import { BaseTheme } from '@shopify/restyle'
import React, { ReactElement } from 'react'
import { SettingsStackNavigationProp, SettingsStackParamList } from 'src/app/navigation/types'
import { Button } from 'src/components/buttons/Button'
import { Arrow } from 'src/components/icons/Arrow'
import { Chevron } from 'src/components/icons/Chevron'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { openUri } from 'src/utils/linking'

export interface SettingsSection {
  subTitle: string
  data: (SettingsSectionItem | SettingsSectionItemComponent)[]
  isHidden?: boolean
}

export interface SettingsSectionItemComponent {
  component: ReactElement
  isHidden?: boolean
}

export interface SettingsSectionItem {
  screen?: keyof SettingsStackParamList
  screenProps?: any
  externalLink?: string
  action?: ReactElement
  text: string
  subText?: string
  icon: ReactElement
  isHidden?: boolean
}

interface SettingsRowProps {
  page: SettingsSectionItem
  navigation: SettingsStackNavigationProp
  theme: BaseTheme
}

export function SettingsRow({
  page: { screen, screenProps, externalLink, action, icon, text, subText },
  navigation,
  theme,
}: SettingsRowProps) {
  const handleRow = () => {
    if (screen) {
      navigation.navigate(screen, screenProps)
    } else {
      openUri(externalLink!)
    }
  }
  return (
    <Button disabled={Boolean(action)} name="DEBUG_Settings_Navigate" onPress={handleRow}>
      <Flex row alignItems="center" minHeight={40}>
        <Flex grow row alignItems={subText ? 'flex-start' : 'center'} flexBasis={0} gap="sm">
          <Flex centered height={32} width={32}>
            {icon}
          </Flex>
          <Flex alignItems="stretch" flex={1} gap="none">
            <Text variant="subheadLarge">{text}</Text>
            {subText && (
              <Text color="textSecondary" numberOfLines={1} variant="caption_deprecated">
                {subText}
              </Text>
            )}
          </Flex>
        </Flex>
        {screen ? (
          <Chevron color={theme.colors.textSecondary} direction="e" height={24} width={24} />
        ) : externalLink ? (
          <Arrow color={theme.colors.textSecondary} direction="ne" size={24} />
        ) : (
          action
        )}
      </Flex>
    </Button>
  )
}
