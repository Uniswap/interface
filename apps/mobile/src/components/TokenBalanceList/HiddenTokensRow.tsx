import { ImpactFeedbackStyle } from 'expo-haptics'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Chevron } from 'src/components/icons/Chevron'
import { AnimatedBox, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'

export function HiddenTokensRow({
  numHidden,
  isExpanded,
  onPress,
}: {
  numHidden: number
  isExpanded: boolean
  onPress: () => void
}): JSX.Element {
  const theme = useAppTheme()
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
      <Flex row alignItems="center" justifyContent="space-between" px="spacing24" py="spacing12">
        <Text color="neutral2" variant="subheadSmall">
          {t('Hidden ({{numHidden}})', { numHidden })}
        </Text>
        <Flex
          row
          alignItems="center"
          bg="surface2"
          borderRadius="roundedFull"
          gap="none"
          pl="spacing12"
          pr="spacing8"
          py="spacing8">
          <Text color="neutral2" variant="buttonLabelSmall">
            {isExpanded ? t('Hide') : t('Show')}
          </Text>
          <AnimatedBox style={chevronAnimatedStyle}>
            <Chevron
              color={theme.colors.neutral2}
              direction="s"
              height={theme.iconSizes.icon20}
              width={theme.iconSizes.icon20}
            />
          </AnimatedBox>
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
