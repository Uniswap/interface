import { lighten } from 'polished'
import { FlexProps, Shine, useSporeColors, View } from 'ui/src'

export const LoadingBubble = ({
  containerWidth,
  height,
  width,
  round,
  delay,
  margin,
  ...rest
}: {
  containerWidth?: string | number
  height?: string | number
  width?: string | number
  round?: boolean
  delay?: string
  margin?: string
} & FlexProps) => {
  const colors = useSporeColors()
  return (
    <Shine $platform-web={{ animationDelay: delay, width: containerWidth ?? '100%' }}>
      <View
        borderRadius={round ? '$roundedFull' : '$rounded12'}
        height={height ?? '$spacing24'}
        width={width ?? '50%'}
        m={margin}
        $platform-web={{
          background: `linear-gradient(to left, ${colors.surface3.val} 25%, ${lighten(0.075, colors.surface3.val)} 50%, ${colors.surface3.val} 75%)`,
        }}
        {...rest}
      />
    </Shine>
  )
}
