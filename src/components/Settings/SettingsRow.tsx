import { BaseTheme } from '@shopify/restyle'
import React, { ReactElement } from 'react'
import { SettingsStackNavigationProp, SettingsStackParamList } from 'src/app/navigation/types'
import { Button } from 'src/components/buttons/Button'
import { Chevron } from 'src/components/icons/Chevron'
import { PopoutArrow } from 'src/components/icons/PopoutArrow'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { openUri } from 'src/utils/linking'

export interface SettingsSection {
  subTitle: string
  data: (SettingsSectionItem | SettingsSectionItemComponent)[]
  isHidden?: boolean
}

export interface SettingsSectionItemComponent {
  component: ReactElement
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
    <Button
      disabled={Boolean(action)}
      mb="md"
      name="DEBUG_Settings_Navigate"
      px="sm"
      onPress={handleRow}>
      <Box alignItems="center" flexDirection="row" justifyContent="space-between">
        <Flex row>
          {icon}
          <Flex gap="none">
            <Text fontWeight="500" variant="subHead1">
              {text}
            </Text>
            {subText && (
              <Text color="textSecondary" variant="caption">
                {subText}
              </Text>
            )}
          </Flex>
        </Flex>
        {screen ? (
          <Chevron color={theme.colors.textTertiary} direction="e" height={16} width={16} />
        ) : externalLink ? (
          <PopoutArrow color={theme.colors.textTertiary} size={24} />
        ) : (
          action
        )}
      </Box>
    </Button>
  )
}
