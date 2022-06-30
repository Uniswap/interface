import { Blur, Canvas, Circle, Group, Oval, Rect } from '@shopify/react-native-skia'
import React, { memo } from 'react'
import { useAppTheme } from 'src/app/hooks'
import { GradientBackground } from 'src/components/gradients/GradientBackground'
import { Box } from 'src/components/layout/Box'
import { flex } from 'src/styles/flex'
import { dimensions } from 'src/styles/sizing'
import { opacify } from 'src/utils/colors'

const { fullWidth, fullHeight } = dimensions
const BASE_BLUR_RADIUS = fullWidth * 0.75
const ACCENT_BLUR_WIDTH = fullWidth
const ACCENT_BLUR_HEIGHT = fullWidth * 0.5

export const AppBackground = memo(({ isStrongAccent = false }: { isStrongAccent?: boolean }) => {
  const theme = useAppTheme()

  return (
    <GradientBackground>
      <Box flex={1}>
        <Canvas style={flex.fill}>
          <Group>
            <Rect
              color={theme.colors.mainBackground}
              height={fullHeight}
              width={fullWidth}
              x={0}
              y={0}
            />
            <Circle color={theme.colors.backgroundAction} cx={0} cy={0} r={BASE_BLUR_RADIUS} />
            <Oval
              color={opacify(100, theme.colors.deprecated_primary1)}
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
})
