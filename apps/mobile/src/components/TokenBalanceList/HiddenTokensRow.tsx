import { ImpactFeedbackStyle } from 'expo-haptics'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { AnimatedBox } from 'src/components/layout'
import { Flex, Icons, Text, TouchableArea } from 'ui/src'
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
        <Text color="$neutral2" variant="subheadSmall">
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
          <Text color="$neutral2" variant="buttonLabelSmall">
            {isExpanded ? t('Hide') : t('Show')}
          </Text>
          <AnimatedBox style={chevronAnimatedStyle}>
            <Icons.RotatableChevron
              color="$neutral2"
              direction="s"
              height={iconSizes.icon20}
              width={iconSizes.icon20}
            />
          </AnimatedBox>
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
