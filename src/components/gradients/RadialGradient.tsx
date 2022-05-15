import React, { ComponentProps, memo, PropsWithChildren } from 'react'
import Svg, { Defs, RadialGradient as RadialGradientSVG, Rect, Stop } from 'react-native-svg'
import { GradientBackground } from 'src/components/gradients/GradientBackground'

interface RadialGradientProps {
  stops: ComponentProps<typeof Stop>[]
}

export const RadialGradient = memo(({ stops }: RadialGradientProps) => {
  return (
    <Svg height="100%" width="100%">
      <Defs>
        <RadialGradientSVG cx="0.18" cy="0" id="background" r="1.2">
          {stops.map(({ ...props }, i) => (
            <Stop {...props} key={i} />
          ))}
        </RadialGradientSVG>
      </Defs>
      <Rect fill="url(#background)" height="100%" opacity={0.2} width="100%" x="0" y="0" />
    </Svg>
  )
})

/** Utility to create boxes with linear backgrounds */
export const RadialGradientBox = memo(
  ({
    children,
    stops,
    ...rest
  }: PropsWithChildren<RadialGradientProps & ComponentProps<typeof GradientBackground>>) => (
    <>
      <GradientBackground {...rest}>
        <RadialGradient stops={stops} />
      </GradientBackground>
      {children}
    </>
  )
)
