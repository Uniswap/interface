import React from 'react'
import Trace from 'src/components/Trace/Trace'
import { ElementName } from 'src/features/telemetry/constants'
import { Flex, Text, TouchableArea, useMedia } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { useIsDarkMode } from 'wallet/src/features/appearance/hooks'

export function OptionCard({
  title,
  blurb,
  icon,
  onPress,
  elementName,
  disabled,
  opacity,
  badgeText,
  hapticFeedback,
}: {
  title: string
  blurb: string
  icon: React.ReactNode
  onPress: () => void
  elementName: ElementName
  disabled?: boolean
  opacity?: number
  badgeText?: string | undefined
  hapticFeedback?: boolean | undefined
}): JSX.Element {
  const media = useMedia()
  const isDarkMode = useIsDarkMode()

  const iconSize = media.short ? iconSizes.icon24 : iconSizes.icon36

  return (
    <Trace logPress element={elementName}>
      <TouchableArea
        backgroundColor="$surface2"
        borderColor={isDarkMode ? '$transparent' : '$surface3'}
        borderRadius="$rounded20"
        borderWidth={1}
        disabled={disabled}
        hapticFeedback={hapticFeedback}
        opacity={disabled ? 0.5 : opacity}
        p="$spacing16"
        testID={elementName}
        onPress={onPress}>
        <Flex row alignContent="center" alignItems="center" gap="$spacing16">
          <Flex
            alignItems="center"
            backgroundColor="$DEP_magentaDark"
            borderRadius="$roundedFull"
            height={iconSize}
            justifyContent="center"
            p="$spacing16"
            width={iconSize}>
            {icon}
          </Flex>
          <Flex row alignItems="center" gap="$spacing4" pr="$spacing60">
            <Flex fill alignItems="flex-start" gap="$spacing4" justifyContent="space-around">
              <Flex row gap="$spacing8">
                <Text $short={{ variant: 'subheading2' }} allowFontScaling={false} variant="body1">
                  {title}
                </Text>
                {badgeText && (
                  <Flex
                    centered
                    backgroundColor="$DEP_magentaDark"
                    borderRadius="$rounded8"
                    px="$spacing8">
                    <Text color="$accent1" variant="buttonLabel4">
                      {badgeText}
                    </Text>
                  </Flex>
                )}
              </Flex>
              <Text allowFontScaling={false} color="$neutral2" variant="body2">
                {blurb}
              </Text>
            </Flex>
          </Flex>
        </Flex>
      </TouchableArea>
    </Trace>
  )
}
