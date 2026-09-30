import type { ResolvedFontStyle } from '@universe/mycelium'
import { memo } from 'react'
import type { TextStyle } from 'react-native'
import { Text, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { startFlashSequence } from 'uniswap/src/components/AnimatedNumber/native/startFlashSequence'
import type { CellFlash } from 'uniswap/src/components/AnimatedNumber/native/types'
import { useCapturedGen } from 'uniswap/src/components/AnimatedNumber/native/useCapturedGen'
import { useDigitTextStyle } from 'uniswap/src/components/AnimatedNumber/native/useDigitTextStyle'
import { useOnTick } from 'uniswap/src/components/AnimatedNumber/native/useOnTick'

const overlayStyle = { position: 'absolute', top: 0, left: 0 } as const

/**
 * Cross-fades a same-glyph copy in the flash color via opacity: animating `color` would commit
 * every frame under Fabric.
 */
const NonDigitFlashOverlay = ({
  char,
  gen,
  flashColor,
  textStyle,
}: {
  char: string | undefined
  gen: number
  flashColor: string
  textStyle: TextStyle
}): JSX.Element => {
  const flashOpacity = useSharedValue(0)

  useOnTick({
    gen,
    fireOnMount: true,
    onTick: () => {
      startFlashSequence(flashOpacity)
    },
  })

  const animatedFlashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }))

  return (
    <Animated.Text
      accessibilityElementsHidden
      accessible={false}
      allowFontScaling={false}
      importantForAccessibility="no-hide-descendants"
      style={[textStyle, { color: flashColor }, overlayStyle, animatedFlashStyle]}
    >
      {char}
    </Animated.Text>
  )
}

/**
 * Static glyph (currency symbol, separator) whose flash overlay mounts lazily on the first flash
 * and stays until suspended, like DigitCell. Memoized: CharRow passes a stable no-op `flash` to unflashed cells.
 */
export const NonDigitCell = memo(function NonDigitCell({
  char,
  flash,
  charBaseColor,
  digitHeight,
  variantFont,
  useHeadingTypography,
  suspendAnimations,
}: {
  char: string | undefined
  flash: CellFlash
  charBaseColor: string
  digitHeight: number
  variantFont: ResolvedFontStyle
  useHeadingTypography: boolean
  suspendAnimations: boolean
}): JSX.Element {
  const digitTextStyle = useDigitTextStyle({ variantFont, digitHeight, useHeadingTypography })

  const captured = useCapturedGen({ gen: flash.gen, suspendAnimations, capture: () => flash })

  return (
    <View>
      <Text accessible={false} allowFontScaling={false} style={[digitTextStyle, { color: charBaseColor }]}>
        {char}
      </Text>
      {captured?.color !== undefined && (
        <NonDigitFlashOverlay char={char} flashColor={captured.color} gen={captured.gen} textStyle={digitTextStyle} />
      )}
    </View>
  )
})
