import { lighten } from 'polished'
import { FlexProps, Shine, useSporeColors, View, ViewProps } from 'ui/src'

interface LoadingBubbleProps {
  delay?: string
  round?: boolean
  height?: ViewProps['height']
  width?: ViewProps['width']
  containerProps?: FlexProps
  skeletonProps?: ViewProps
}

export const LoadingBubble = ({
  delay,
  round,
  height = '$spacing24',
  width = '50%',
  containerProps,
  skeletonProps,
}: LoadingBubbleProps) => {
  const colors = useSporeColors()

  return (
    <Shine flexDirection="row" width="100%" $platform-web={{ animationDelay: delay }} {...containerProps}>
      <View
        borderRadius={round ? '$roundedFull' : '$rounded12'}
        height={height}
        width={width}
        $platform-web={{
          background: `linear-gradient(to left, ${colors.surface3.val} 25%, ${lighten(0.075, colors.surface3.val)} 50%, ${colors.surface3.val} 75%)`,
        }}
        {...skeletonProps}
      />
    </Shine>
  )
}
