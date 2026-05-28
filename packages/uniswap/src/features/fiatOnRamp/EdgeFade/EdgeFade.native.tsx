import { FlexProps, LinearGradient, useSporeColors } from 'ui/src'
import { opacify } from 'ui/src/theme'

export function EdgeFade({ side, width }: { side: 'left' | 'right' } & FlexProps): JSX.Element {
  const colors = useSporeColors()
  return (
    <LinearGradient
      position="absolute"
      top={0}
      bottom={0}
      pointerEvents="none"
      zIndex={1}
      left={side === 'left' ? 0 : undefined}
      right={side === 'right' ? 0 : undefined}
      colors={[opacify(90, colors.surface1.val), opacify(0, colors.surface1.val)]}
      start={{ x: side === 'left' ? 0 : 1, y: 0 }}
      end={{ x: side === 'left' ? 1 : 0, y: 0 }}
      width={width}
    />
  )
}
