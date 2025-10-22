import MaskedView from '@react-native-masked-view/masked-view'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useMemo, useState } from 'react'
import { LayoutRectangle, StyleSheet } from 'react-native'
import Reanimated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { Flex } from 'ui/src/components/layout'
import { useSporeColors } from 'ui/src/hooks/useSporeColors'
import { ShineProps } from 'ui/src/loading/ShineProps'
import { opacify } from 'ui/src/theme'
import { useEvent } from 'utilities/src/react/hooks'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

const LINEAR_GRADIENT_END = { x: 1, y: 0 }
const LINEAR_GRADIENT_START = { x: 0, y: 0 }

const BLACK_HEX_COLOR = '#000000'

export function Shine({ shimmerDurationSeconds = 2, children, disabled }: ShineProps): JSX.Element {
  const colors = useSporeColors()
  const shimmerDuration = shimmerDurationSeconds * ONE_SECOND_MS

  const [layout, setLayout] = useState<LayoutRectangle | null>()
  const xPosition = useSharedValue(0)

  useEffect(() => {
    xPosition.value = withRepeat(withTiming(1, { duration: shimmerDuration }), Infinity, false)
  }, [xPosition, shimmerDuration])

  const animatedStyle = useAnimatedStyle(() => ({
    ...StyleSheet.absoluteFillObject,
    transform: [
      {
        translateX: interpolate(xPosition.value, [0, 1], [layout ? -layout.width : 0, layout ? layout.width : 0]),
      },
    ],
  }))

  const handleOnLayout = useEvent(
    (event: { nativeEvent: { layout: React.SetStateAction<LayoutRectangle | null | undefined> } }): void => {
      setLayout(event.nativeEvent.layout)
    },
  )

  const gradientColors: [string, string, string] = useMemo(() => {
    const hexColorForOpacifying = ((): string => {
      const maybeColor = colors.black.val

      if (maybeColor.startsWith('#') && colors.black.val.length === 7) {
        return maybeColor
      }

      return BLACK_HEX_COLOR
    })()

    return [opacify(0, hexColorForOpacifying), opacify(44, hexColorForOpacifying), opacify(0, hexColorForOpacifying)]
  }, [colors.black.val])

  const maskedViewStyle = useMemo(() => ({ width: layout?.width, height: layout?.height }), [layout])

  if (disabled) {
    return children
  }

  if (!layout) {
    return (
      <Flex opacity={0} onLayout={handleOnLayout}>
        {children}
      </Flex>
    )
  }

  return (
    <MaskedView maskElement={children} style={maskedViewStyle}>
      <Flex grow backgroundColor="$neutral2" height="100%" overflow="hidden" />
      <Reanimated.View style={animatedStyle}>
        <LinearGradient
          colors={gradientColors}
          end={LINEAR_GRADIENT_END}
          start={LINEAR_GRADIENT_START}
          style={StyleSheet.absoluteFill}
        />
      </Reanimated.View>
    </MaskedView>
  )
}
