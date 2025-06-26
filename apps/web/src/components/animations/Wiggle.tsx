import { forwardRef, PropsWithChildren, useState } from 'react'
import { Flex, FlexProps, useSporeColors } from 'ui/src'

const wiggleKeyframe = `
  @keyframes wiggle {
    0% {
      transform: rotate(0deg) scale(1);
    }
    30% {
      transform: rotate(20deg) scale(1.1);
    }
    60% {
      transform: rotate(-10deg) scale(1.2);
    }
    100% {
      transform: rotate(0deg) scale(1.15);
    }
  }
`

export const Wiggle = forwardRef<any, PropsWithChildren<FlexProps> & { iconColor?: string }>(
  ({ iconColor, children, ...props }, ref) => {
    const [isHovering, setIsHovering] = useState(false)
    const colors = useSporeColors()

    return (
      <>
        <style>{wiggleKeyframe}</style>
        <Flex
          ref={ref}
          onHoverIn={() => setIsHovering(true)}
          onHoverOut={() => setIsHovering(false)}
          {...props}
          style={{
            animationName: isHovering ? 'wiggle' : 'none',
            animationDuration: '0.5s',
            animationTimingFunction: 'ease-in-out',
            animationFillMode: 'forwards',
            animationIterationCount: 1,
            animationDirection: 'normal',
            transition: 'fill 0.3s ease-in-out',
            fill: isHovering ? iconColor || colors.neutral1.val : colors.neutral1.val,
          }}
        >
          {children}
        </Flex>
      </>
    )
  },
)

Wiggle.displayName = 'Wiggle'
