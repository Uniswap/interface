import { Flex, FlexProps, useSporeColors } from 'ui/src'
import { opacify } from 'ui/src/theme'

export function EdgeFade({ side, ...rest }: { side: 'left' | 'right' } & FlexProps): JSX.Element {
  const colors = useSporeColors()
  return (
    <Flex
      position="absolute"
      top={0}
      bottom={0}
      pointerEvents="none"
      zIndex={1}
      left={side === 'left' ? 0 : undefined}
      right={side === 'right' ? 0 : undefined}
      style={{
        background: `linear-gradient(${side === 'left' ? '90deg' : '270deg'}, ${opacify(90, colors.surface1.val)} 0%, ${opacify(0, colors.surface1.val)} 100%)`,
      }}
      {...rest}
    />
  )
}
