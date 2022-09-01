import { Blur, Canvas, Group, Oval, RadialGradient, Rect, vec } from '@shopify/react-native-skia'
import React, { ComponentProps, memo } from 'react'
import { useColorScheme } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import { GradientBackground } from 'src/components/gradients/GradientBackground'
import { Box } from 'src/components/layout/Box'
import { flex } from 'src/styles/flex'
import { dimensions } from 'src/styles/sizing'
import { opacify } from 'src/utils/colors'

const { fullWidth, fullHeight } = dimensions
const ACCENT_BLUR_WIDTH = fullWidth
const ACCENT_BLUR_HEIGHT = fullWidth * 0.5

const BG_BLUR_VALUES: {
  opacity: number
  startColor: string
  endColor: string
  radius: number
  startXPos: number
  startYPos: number
} = {
  opacity: 0.32,
  startColor: '#7095DF',
  endColor: '#00000000',
  radius: 400,
  startXPos: -124,
  startYPos: -163,
}

const bgBlurContainerProps: ComponentProps<typeof Rect> = {
  opacity: BG_BLUR_VALUES.opacity,
  height: BG_BLUR_VALUES.radius,
  width: BG_BLUR_VALUES.radius,
  x: BG_BLUR_VALUES.startXPos,
  y: BG_BLUR_VALUES.startYPos,
}

const bgBlurGradientProps: ComponentProps<typeof RadialGradient> = {
  colors: [BG_BLUR_VALUES.startColor, BG_BLUR_VALUES.endColor],
  r: BG_BLUR_VALUES.radius,
  c: vec(0, 0),
}

export const DynamicAppBackground = memo(
  ({
    isStrongAccent = false,
    topOnly = false,
    color,
  }: {
    isStrongAccent?: boolean
    topOnly?: boolean
    color?: string
  }) => {
    const theme = useAppTheme()
    const isDarkMode = useColorScheme() === 'dark'

    return (
      <GradientBackground>
        <Box flex={1}>
          <Canvas style={flex.fill}>
            <Group>
              <Rect
                color={theme.colors.backgroundBackdrop}
                height={fullHeight}
                width={fullWidth}
                x={0}
                y={0}
              />
              {isDarkMode && !topOnly && (
                <Rect {...bgBlurContainerProps}>
                  <RadialGradient {...bgBlurGradientProps} />
                </Rect>
              )}
              <Oval
                color={opacify(100, color || theme.colors.userThemeColor)}
                height={ACCENT_BLUR_HEIGHT}
                width={ACCENT_BLUR_WIDTH}
                x={0}
                y={isStrongAccent ? -ACCENT_BLUR_HEIGHT * 0.9 : -ACCENT_BLUR_HEIGHT}
              />
              <Blur blur={40} />
            </Group>
          </Canvas>
        </Box>
      </GradientBackground>
    )
  }
)
