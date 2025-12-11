import {
  EmblemA,
  EmblemB,
  EmblemC,
  EmblemD,
  EmblemE,
  EmblemF,
  EmblemG,
  EmblemH,
} from 'pages/Portfolio/components/AnimatedStyledBanner/Emblems'
import { ReactElement } from 'react'
import { Flex, useIsDarkMode, useSporeColors } from 'ui/src'
import { zIndexes } from 'ui/src/theme'

interface AnimatedEmblemProps {
  children: ReactElement
  duration?: string
  delay?: string
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const KEYFRAMES_CW = `
  @keyframes emblemEnterCW {
    from {
      opacity: 0;
      transform: scale(0.7) rotate(30deg);
    }
    to {
      opacity: 1;
      transform: scale(1) rotate(0deg);
    }
  }
`

const KEYFRAMES_CCW = `
  @keyframes emblemEnterCCW {
    from {
      opacity: 0;
      transform: scale(0.7) rotate(-30deg);
    }
    to {
      opacity: 1;
      transform: scale(1) rotate(0deg);
    }
  }
`

const ALL_KEYFRAMES = KEYFRAMES_CW + KEYFRAMES_CCW

function AnimatedEmblem({
  children,
  duration = '300ms',
  delay,
  rotationDirection = 'clockwise',
}: AnimatedEmblemProps): JSX.Element {
  const animationName = rotationDirection === 'clockwise' ? 'emblemEnterCW' : 'emblemEnterCCW'

  return (
    <Flex
      $platform-web={{
        animationName,
        animationDuration: duration,
        animationDelay: delay,
        animationTimingFunction: 'ease-out',
        animationFillMode: 'forwards',
        opacity: 0, // Start state
      }}
    >
      {children}
    </Flex>
  )
}

export function AnimatedEmblems(): JSX.Element {
  const colors = useSporeColors()
  const isDarkMode = useIsDarkMode()
  const opacity = isDarkMode ? 0.4 : 0.5
  const animationDuration = '300ms'
  const animationDelay = ['50ms', '100ms', '150ms', '200ms', '250ms', '300ms', '350ms', '400ms']

  return (
    <>
      <style>{ALL_KEYFRAMES}</style>
      <Flex position="absolute" top={20} left={-15} transform="rotate(90deg)" zIndex={zIndexes.background}>
        <AnimatedEmblem duration={animationDuration} delay={animationDelay[2]} rotationDirection="clockwise">
          <EmblemB width={71} height={71} fill={colors.accent1.val} opacity={opacity} />
        </AnimatedEmblem>
      </Flex>
      <Flex position="absolute" bottom={20} left={180} zIndex={zIndexes.background}>
        <AnimatedEmblem duration={animationDuration} delay={animationDelay[0]} rotationDirection="counterclockwise">
          <EmblemA width={71} height={71} fill={colors.accent1.val} opacity={opacity} />
        </AnimatedEmblem>
      </Flex>
      <Flex position="absolute" top={30} left={120} zIndex={zIndexes.background}>
        <AnimatedEmblem duration={animationDuration} delay={animationDelay[4]} rotationDirection="clockwise">
          <EmblemE width={71} height={71} fill={colors.accent1.val} opacity={opacity} />
        </AnimatedEmblem>
      </Flex>
      <Flex position="absolute" bottom={30} left={50} zIndex={zIndexes.background}>
        <AnimatedEmblem duration={animationDuration} delay={animationDelay[6]} rotationDirection="counterclockwise">
          <EmblemF width={65} height={65} fill={colors.accent1.val} opacity={opacity} />
        </AnimatedEmblem>
      </Flex>
      <Flex position="absolute" top={70} right={150} transform="rotate(10deg)" zIndex={zIndexes.background}>
        <AnimatedEmblem duration={animationDuration} delay={animationDelay[1]} rotationDirection="clockwise">
          <EmblemH width={61} height={61} fill={colors.accent1.val} opacity={opacity} />
        </AnimatedEmblem>
      </Flex>
      <Flex position="absolute" bottom={-35} right={75} zIndex={zIndexes.background}>
        <AnimatedEmblem duration={animationDuration} delay={animationDelay[3]} rotationDirection="counterclockwise">
          <EmblemC width={76} height={76} fill={colors.accent1.val} opacity={opacity} />
        </AnimatedEmblem>
      </Flex>
      <Flex position="absolute" top={35} right={35} transform="rotate(-10deg)" zIndex={zIndexes.background}>
        <AnimatedEmblem duration={animationDuration} delay={animationDelay[7]} rotationDirection="clockwise">
          <EmblemD width={62} height={62} fill={colors.accent1.val} opacity={opacity} />
        </AnimatedEmblem>
      </Flex>
      <Flex position="absolute" right={200} top={-15} zIndex={zIndexes.background}>
        <AnimatedEmblem duration={animationDuration} delay={animationDelay[5]} rotationDirection="counterclockwise">
          <EmblemG width={69} height={69} fill={colors.accent1.val} opacity={opacity} />
        </AnimatedEmblem>
      </Flex>
    </>
  )
}
