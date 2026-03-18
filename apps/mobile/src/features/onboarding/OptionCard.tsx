import React from 'react'
import { Flex, Text, TouchableArea, useIsDarkMode } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestIDType } from 'uniswap/src/test/fixtures/testIDs'

export function OptionCard({
  title,
  blurb,
  icon,
  onPress,
  elementName,
  disabled,
  opacity,
  badgeText,
  testID,
}: {
  title: string
  blurb: string
  icon: React.ReactNode
  onPress: () => void
  elementName: ElementName
  testID: TestIDType
  disabled?: boolean
  opacity?: number
  badgeText?: string | undefined
}): JSX.Element {
  const isDarkMode = useIsDarkMode()

  return (
    <Trace logPress element={elementName}>
      <TouchableArea
        backgroundColor={isDarkMode ? '$surface2' : '$surface1'}
        borderColor="$surface3"
        borderRadius="$rounded20"
        borderWidth="$spacing1"
        disabled={disabled}
        opacity={disabled ? 0.5 : opacity}
        p="$spacing16"
        testID={testID}
        onPress={onPress}
      >
        <Flex row alignContent="center" alignItems="flex-start" gap="$spacing16">
          <Flex
            alignItems="center"
            backgroundColor="$accent2"
            borderRadius="$roundedFull"
            height={iconSizes.icon32}
            justifyContent="center"
            width={iconSizes.icon32}
            {...(badgeText && { mt: '$spacing4' })}
          >
            {icon}
          </Flex>
          <Flex row alignItems="center" gap="$spacing4" pr="$spacing60">
            <Flex fill alignItems="flex-start" gap="$spacing4" justifyContent="space-around">
              <Flex row gap="$spacing8">
                <Flex fill {...(badgeText && { py: '$spacing4' })}>
                  <Text $short={{ variant: 'subheading2' }} allowFontScaling={false} variant="body2">
                    {title}
                  </Text>
                </Flex>
                {badgeText && (
                  <Flex
                    centered
                    backgroundColor="$DEP_magentaDark"
                    borderRadius="$rounded8"
                    py="$spacing2"
                    px="$spacing6"
                    maxWidth="30%"
                  >
                    <Text textAlign="center" color="$accent1" variant="buttonLabel3">
                      {badgeText}
                    </Text>
                  </Flex>
                )}
              </Flex>
              <Text allowFontScaling={false} color="$neutral2" variant="body3">
                {blurb}
              </Text>
            </Flex>
          </Flex>
        </Flex>
      </TouchableArea>
    </Trace>
  )
}
