import React, { useState } from 'react'
import { LayoutRectangle, Pressable } from 'react-native'
import { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { AnimatedBox, Box } from 'src/components/layout'
import { Text } from 'src/components/Text'

type LongPressButtonProps = {
  onComplete: () => void
  disabled: boolean
  duration?: number
  label: string
  name?: string
}

const DURATION = 1000

export function LongPressButton({
  onComplete,
  disabled,
  duration = DURATION,
  label,
  name,
}: LongPressButtonProps) {
  const [layout, setLayout] = useState<LayoutRectangle | null>()
  const progress = useSharedValue(0)

  const onPressIn = () => {
    progress.value = withTiming(1, { duration })
  }

  const onPressOut = () => {
    progress.value = withTiming(0, { duration: duration / 2 })
  }

  const animatedStyle = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0, 1], [0, layout ? layout.width : 0]),
  }))

  return (
    <Pressable
      delayLongPress={duration}
      disabled={disabled}
      onLongPress={onComplete}
      onPressIn={onPressIn}
      onPressOut={onPressOut}>
      <Box
        alignItems="center"
        backgroundColor="deprecated_primary1"
        borderRadius="lg"
        opacity={disabled ? 0.2 : 1}
        overflow="hidden"
        py="md"
        testID={name}
        onLayout={(event) => setLayout(event.nativeEvent.layout)}>
        <AnimatedBox
          backgroundColor="black"
          height={layout?.height}
          left={0}
          opacity={0.2}
          position="absolute"
          style={animatedStyle}
          top={0}
        />
        <Text color="white" variant="largeLabel">
          {label}
        </Text>
      </Box>
    </Pressable>
  )
}
