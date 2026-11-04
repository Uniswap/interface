import type { TextCompatProps } from '@universe/mycelium/text-compat'
import { colors } from '@universe/mycelium/theme-palette'
import { GradientText } from 'ui/src/components/text/GradientText'

export function UniswapXText({ children, ...props }: TextCompatProps): JSX.Element {
  return (
    <GradientText
      {...props}
      gradient={{
        colors: [colors.uniswapXViolet, colors.uniswapXPurple],
        start: { x: -1.07, y: 0 },
        end: { x: 1.07, y: 0 },
      }}
    >
      {children}
    </GradientText>
  )
}
