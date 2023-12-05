import { ImpactFeedbackStyle } from 'expo-haptics'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { AnimatedFlex, Flex, Icons, Text, TouchableArea } from 'ui/src'
import { iconSizes } from 'ui/src/theme'

export function HiddenTokensRow({
  numHidden,
  isExpanded,
  onPress,
}: {
  numHidden: number
  isExpanded: boolean
  onPress: () => void
}): JSX.Element {
  const { t } = useTranslation()

  const chevronRotate = useSharedValue(isExpanded ? 180 : 0)

  const chevronAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotateZ: `${chevronRotate.value}deg` }],
    }
  })

  const onPressRow = useCallback(() => {
    chevronRotate.value = withTiming(chevronRotate.value === 0 ? 180 : 0, {
      duration: 150,
      easing: Easing.ease,
    })
    onPress()
  }, [chevronRotate, onPress])

  return (
    <TouchableArea hapticFeedback hapticStyle={ImpactFeedbackStyle.Light} onPress={onPressRow}>
      <Flex row alignItems="center" justifyContent="space-between" px="$spacing24" py="$spacing12">
        <Text color="$neutral2" variant="subheading2">
          {t('Hidden ({{numHidden}})', { numHidden })}
        </Text>
        <Flex
          row
          alignItems="center"
          bg="$surface2"
          borderRadius="$roundedFull"
          pl="$spacing12"
          pr="$spacing8"
          py="$spacing8">
          <Text color="$neutral2" variant="buttonLabel3">
            {isExpanded ? t('Hide') : t('Show')}
          </Text>
          <AnimatedFlex style={chevronAnimatedStyle}>
            <Icons.RotatableChevron
              color="$neutral2"
              direction="down"
              height={iconSizes.icon20}
              width={iconSizes.icon20}
            />
          </AnimatedFlex>
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
