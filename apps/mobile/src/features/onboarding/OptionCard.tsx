import { useResponsiveProp } from '@shopify/restyle'
import { SharedEventName } from '@uniswap/analytics-events'
import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { useIsDarkMode } from 'src/features/appearance/hooks'
import { ElementName } from 'src/features/telemetry/constants'

export function OptionCard({
  title,
  blurb,
  icon,
  onPress,
  name,
  disabled,
  opacity,
  badgeText,
}: {
  title: string
  blurb: string
  icon: React.ReactNode
  onPress: () => void
  name: ElementName
  disabled?: boolean
  opacity?: number
  badgeText?: string | undefined
}): JSX.Element {
  const theme = useAppTheme()

  const titleSize = useResponsiveProp({
    xs: 'subheadSmall',
    sm: 'bodyLarge',
  })

  const iconSize = useResponsiveProp({
    xs: theme.iconSizes.icon24,
    sm: theme.iconSizes.icon36,
  })

  const isDarkMode = useIsDarkMode()

  return (
    <TouchableArea
      backgroundColor="background1"
      borderColor={isDarkMode ? 'none' : 'backgroundScrim'}
      borderRadius="rounded20"
      borderWidth={1}
      disabled={disabled}
      eventName={SharedEventName.ELEMENT_CLICKED}
      name={name}
      opacity={opacity}
      p="spacing16"
      testID={name}
      onPress={onPress}>
      <Flex row alignContent="center" alignItems="center" gap="spacing16">
        <Box
          alignItems="center"
          backgroundColor="magentaDark"
          borderRadius="roundedFull"
          height={iconSize}
          justifyContent="center"
          padding="spacing16"
          width={iconSize}>
          {icon}
        </Box>
        <Flex row alignItems="center" gap="spacing4" paddingRight="spacing60">
          <Flex fill alignItems="flex-start" gap="spacing4" justifyContent="space-around">
            <Flex row gap="spacing8">
              <Text allowFontScaling={false} variant={titleSize}>
                {title}
              </Text>
              {badgeText && (
                <Flex centered backgroundColor="magentaDark" borderRadius="rounded8" px="spacing8">
                  <Text color="magentaVibrant" variant="buttonLabelMicro">
                    {badgeText}
                  </Text>
                </Flex>
              )}
            </Flex>
            <Text allowFontScaling={false} color="textSecondary" variant="bodySmall">
              {blurb}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
