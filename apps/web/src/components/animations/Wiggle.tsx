import { forwardRef, PropsWithChildren } from 'react'
import { Flex, FlexProps, useSporeColors } from 'ui/src'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

const getWiggleKeyframe = ({ wiggleAmount = 20 }: { wiggleAmount?: number }) => {
  return `
  @keyframes wiggle {
    0% {
      transform: rotate(0deg) scale(1);
    }
    30% {
      transform: rotate(${wiggleAmount}deg) scale(1.05);
    }
    60% {
      transform: rotate(-${wiggleAmount / 2}deg) scale(1.1);
    }
    100% {
      transform: rotate(0deg) scale(1.06);
    }
  }
`
}

export const Wiggle = forwardRef<
  any,
  PropsWithChildren<FlexProps> & { wiggleAmount?: number; iconColor?: string; isAnimating?: boolean }
>(({ wiggleAmount = 20, iconColor, children, isAnimating, ...props }, ref) => {
  const { value: isHovering, setTrue: setIsHovering, setFalse: setIsHoveringFalse } = useBooleanState(false)
  const colors = useSporeColors()
  const wiggleKeyframe = getWiggleKeyframe({ wiggleAmount })
  // Use external isAnimating prop if provided, otherwise use internal hover state
  const shouldAnimate = isAnimating !== undefined ? isAnimating : isHovering

  return (
    <>
      <style>{wiggleKeyframe}</style>
      <Flex
        ref={ref}
        onHoverIn={setIsHovering}
        onHoverOut={setIsHoveringFalse}
        {...props}
        style={{
          animationName: shouldAnimate ? 'wiggle' : 'none',
          animationDuration: '0.5s',
          animationTimingFunction: 'ease-in-out',
          animationFillMode: 'forwards',
          animationIterationCount: 1,
          animationDirection: 'normal',
          transition: 'fill 0.3s ease-in-out',
          fill: shouldAnimate ? iconColor || colors.neutral1.val : colors.neutral1.val,
        }}
      >
        {children}
      </Flex>
    </>
  )
})

Wiggle.displayName = 'Wiggle'
