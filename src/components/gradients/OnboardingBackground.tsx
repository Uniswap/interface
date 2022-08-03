import { Blur, Canvas, Group, Circle } from '@shopify/react-native-skia'
import React, { memo } from 'react'
import { useAppTheme } from 'src/app/hooks'
import { GradientBackground } from 'src/components/gradients/GradientBackground'
import { flex } from 'src/styles/flex'
import { dimensions } from 'src/styles/sizing'

const ACCENT_BLUR_WIDTH = dimensions.fullWidth

export const OnboardingBackground = memo(({}: { color?: string }) => {
  const theme = useAppTheme()

  return (
    <GradientBackground>
      <Canvas style={flex.fill}>
        <Group>
          <Circle color={theme.colors.backgroundAction} cx={76} cy={37} r={ACCENT_BLUR_WIDTH / 2} />
          <Blur blur={80} />
        </Group>
      </Canvas>
    </GradientBackground>
  )
})
