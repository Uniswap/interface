import { PropsWithChildren, useState } from 'react'
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

export function Wiggle({ iconColor, children, ...props }: PropsWithChildren<FlexProps> & { iconColor?: string }) {
  const [isHovering, setIsHovering] = useState(false)
  const colors = useSporeColors()

  return (
    <>
      <style>{wiggleKeyframe}</style>
      <Flex
        onHoverIn={() => setIsHovering(true)}
        onHoverOut={() => setIsHovering(false)}
        {...props}
        style={{
          animation: isHovering ? 'wiggle 0.5s ease-in-out forwards' : 'none',
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
}
