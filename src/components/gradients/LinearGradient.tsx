import React, { ComponentProps, memo, PropsWithChildren } from 'react'
import { Defs, LinearGradient as SVGLinearGradient, Rect, Stop, Svg } from 'react-native-svg'
import { useAppTheme } from 'src/app/hooks'
import { GradientBackground } from 'src/components/gradients/GradientBackground'
import { theme } from 'src/styles/theme'

interface LinearGradientProps {
  radius?: keyof typeof theme['borderRadii']
  stops: ComponentProps<typeof Stop>[]
}

/** Renders a linear gradient based on the provided stops */
export function LinearGradient({ radius, stops }: LinearGradientProps) {
  const appTheme = useAppTheme()
  return (
    <Svg height="100%" width="100%">
      <Defs>
        <SVGLinearGradient id="linear-gradient" x1="0" x2="1" y1="0" y2="1">
          {stops.map(({ ...props }, i) => (
            <Stop {...props} key={i} />
          ))}
        </SVGLinearGradient>
      </Defs>
      <Rect
        fill="url(#linear-gradient)"
        height="100%"
        rx={appTheme.borderRadii[radius ?? 'none']}
        width="100%"
        x="0"
        y="0"
      />
    </Svg>
  )
}

/** Utility to create boxes with linear backgrounds */
export const LinearGradientBox = memo(
  ({
    children,
    radius = 'none',
    stops,
    ...rest
  }: PropsWithChildren<LinearGradientProps & ComponentProps<typeof GradientBackground>>) => (
    <>
      <GradientBackground {...rest}>
        <LinearGradient radius={radius} stops={stops} />
      </GradientBackground>
      {children}
    </>
  )
)
