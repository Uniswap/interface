import styled, { css, keyframes } from 'lib/styled-components'
import { memo, useMemo } from 'react'
import { useIsDarkMode } from 'theme/components/ThemeToggle'
import { breakpoints } from 'ui/src/theme'

// Bubble float animation - simulates bubbles floating in water
const bubbleFloat = keyframes`
  0% {
    transform: translate3d(0, 0, 0) scale(1);
    opacity: 0.6;
  }
  25% {
    transform: translate3d(15px, -20px, 0) scale(1.05);
    opacity: 0.7;
  }
  50% {
    transform: translate3d(25px, -35px, 0) scale(1.1);
    opacity: 0.8;
  }
  75% {
    transform: translate3d(10px, -25px, 0) scale(1.05);
    opacity: 0.7;
  }
  100% {
    transform: translate3d(0, 0, 0) scale(1);
    opacity: 0.6;
  }
`

// Bubble inner glow animation
const bubbleGlow = keyframes`
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.1);
  }
`

// Pulse animation
const pulseGlow = keyframes`
  0%, 100% {
    opacity: 0.4;
    transform: translate3d(-50%, -50%, 0) scale(1);
  }
  50% {
    opacity: 0.8;
    transform: translate3d(-50%, -50%, 0) scale(1.3);
  }
`

// Flowing line animation
const flowLine = keyframes`
  0% {
    stroke-dashoffset: 0;
    opacity: 0.3;
  }
  50% {
    opacity: 0.6;
  }
  100% {
    stroke-dashoffset: 100;
    opacity: 0.3;
  }
`

// Gradient orb floating animation
const floatOrb = keyframes`
  0%, 100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  33% {
    transform: translate3d(50px, -50px, 0) scale(1.15);
  }
  66% {
    transform: translate3d(-40px, 40px, 0) scale(0.9);
  }
`

const BackgroundContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
  contain: layout style;
  transform: translateZ(0);
  backface-visibility: hidden;
  perspective: 1000px;
`

// Bubble component - circular bubble effect
const Bubble = styled.div<{
  $x: number
  $y: number
  $delay: number
  $size: number
  $isDark: boolean
}>`
  position: absolute;
  left: ${({ $x }) => $x}%;
  top: ${({ $y }) => $y}%;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  transform: translate3d(-50%, -50%, 0) translateZ(0);
  animation: ${bubbleFloat} ${({ $delay }) => 6 + $delay * 1.5}s ease-in-out infinite;
  animation-delay: ${({ $delay }) => $delay}s;
  will-change: transform, opacity;
  contain: layout style;
  border-radius: 50%;
  backface-visibility: hidden;
  isolation: isolate;

  @media screen and (max-width: ${breakpoints.sm}px) {
    width: ${({ $size }) => $size * 0.6}px;
    height: ${({ $size }) => $size * 0.6}px;
  }

  /* Bubble body - semi-transparent circle */
  &::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: ${({ $isDark }) =>
      $isDark
        ? 'radial-gradient(circle at 30% 30%, rgba(92, 138, 255, 0.25) 0%, rgba(92, 138, 255, 0.1) 50%, rgba(92, 138, 255, 0.05) 100%)'
        : 'radial-gradient(circle at 30% 30%, rgba(92, 138, 255, 0.2) 0%, rgba(92, 138, 255, 0.08) 50%, rgba(92, 138, 255, 0.03) 100%)'};
    border: 1px solid ${({ $isDark }) => ($isDark ? 'rgba(92, 138, 255, 0.3)' : 'rgba(92, 138, 255, 0.25)')};
    box-shadow: ${({ $isDark }) =>
      $isDark
        ? 'inset 0 0 20px rgba(92, 138, 255, 0.2), 0 0 30px rgba(92, 138, 255, 0.15)'
        : 'inset 0 0 20px rgba(92, 138, 255, 0.15), 0 0 25px rgba(92, 138, 255, 0.1)'};
    transform: translateZ(0);
    backface-visibility: hidden;
    /* Disable backdrop-filter on mobile to improve performance */
    @media screen and (min-width: ${breakpoints.sm + 1}px) {
      backdrop-filter: blur(2px);
      will-change: backdrop-filter;
    }
  }

  /* Bubble highlight - simulates light reflection */
  &::after {
    content: '';
    position: absolute;
    width: 35%;
    height: 35%;
    top: 20%;
    left: 25%;
    border-radius: 50%;
    background: ${({ $isDark }) =>
      $isDark
        ? 'radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 70%)'
        : 'radial-gradient(circle, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0) 70%)'};
    animation: ${bubbleGlow} 3s ease-in-out infinite;
    animation-delay: ${({ $delay }) => $delay * 0.5}s;
    pointer-events: none;
    transform: translateZ(0);
    will-change: transform, opacity;
    backface-visibility: hidden;
  }
`

// Pulse node
const PulseNode = styled.div<{ $x: number; $y: number; $delay: number; $isDark: boolean }>`
  position: absolute;
  left: ${({ $x }) => $x}%;
  top: ${({ $y }) => $y}%;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ $isDark }) => ($isDark ? 'rgba(92, 138, 255, 0.8)' : 'rgba(92, 138, 255, 0.7)')};
  box-shadow: 0 0 16px ${({ $isDark }) => ($isDark ? 'rgba(92, 138, 255, 0.6)' : 'rgba(92, 138, 255, 0.5)')};
  transform: translate3d(-50%, -50%, 0) translateZ(0);
  animation: ${pulseGlow} 3s ease-in-out infinite;
  animation-delay: ${({ $delay }) => $delay}s;
  will-change: transform, opacity;
  contain: layout style;
  backface-visibility: hidden;
`

// SVG container for irregular lines
const FlowSVG = styled.svg<{ $isDark: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.4;
  contain: layout style;
  transform: translateZ(0);
  backface-visibility: hidden;
`

// Flowing line path
const FlowPath = styled.path<{ $delay: number }>`
  fill: none;
  stroke: ${({ theme }) => (theme.darkMode ? 'rgba(92, 138, 255, 0.3)' : 'rgba(92, 138, 255, 0.25)')};
  stroke-width: 0.5;
  stroke-dasharray: 10 5;
  animation: ${flowLine} 8s linear infinite;
  animation-delay: ${({ $delay }) => $delay}s;
  will-change: stroke-dashoffset, opacity;
  vector-effect: non-scaling-stroke;
  transform: translateZ(0);
`

const floatOrbStyle = css`
  animation: ${floatOrb} 25s ease-in-out infinite;
`

const GradientOrbBase = styled.div<{ $delay?: string; $isDark: boolean }>`
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  will-change: transform;
  transform: translate3d(0, 0, 0) translateZ(0);
  ${floatOrbStyle}
  ${({ $delay }) => $delay && `animation-delay: ${$delay};`}
  contain: layout style;
  backface-visibility: hidden;
  isolation: isolate;
`

const GradientOrbTopLeft = styled(GradientOrbBase)`
  top: -10%;
  left: 0%;
  width: 750px;
  height: 750px;
  background: ${({ $isDark }) =>
    $isDark
      ? 'radial-gradient(circle, rgba(92, 138, 255, 0.5) 0%, rgba(92, 138, 255, 0) 60%)'
      : 'radial-gradient(circle, rgba(92, 138, 255, 0.3) 0%, rgba(92, 138, 255, 0) 60%)'};

  @media screen and (max-width: ${breakpoints.sm}px) {
    width: 400px;
    height: 400px;
  }
`

const GradientOrbTopRight = styled(GradientOrbBase)`
  top: -5%;
  right: 5%;
  width: 680px;
  height: 680px;
  background: ${({ $isDark }) =>
    $isDark
      ? 'radial-gradient(circle, rgba(92, 138, 255, 0.45) 0%, rgba(92, 138, 255, 0) 60%)'
      : 'radial-gradient(circle, rgba(92, 138, 255, 0.25) 0%, rgba(92, 138, 255, 0) 60%)'};

  @media screen and (max-width: ${breakpoints.sm}px) {
    width: 350px;
    height: 350px;
  }
`

const GradientOrbBottomLeft = styled(GradientOrbBase)`
  bottom: 0%;
  left: 15%;
  width: 650px;
  height: 650px;
  background: ${({ $isDark }) =>
    $isDark
      ? 'radial-gradient(circle, rgba(92, 138, 255, 0.4) 0%, rgba(92, 138, 255, 0) 60%)'
      : 'radial-gradient(circle, rgba(92, 138, 255, 0.2) 0%, rgba(92, 138, 255, 0) 60%)'};

  @media screen and (max-width: ${breakpoints.sm}px) {
    width: 320px;
    height: 320px;
    left: 5%;
  }
`

const GradientOrbBottomRight = styled(GradientOrbBase)`
  bottom: -5%;
  right: 2%;
  width: 720px;
  height: 720px;
  background: ${({ $isDark }) =>
    $isDark
      ? 'radial-gradient(circle, rgba(92, 138, 255, 0.45) 0%, rgba(92, 138, 255, 0) 60%)'
      : 'radial-gradient(circle, rgba(92, 138, 255, 0.25) 0%, rgba(92, 138, 255, 0) 60%)'};

  @media screen and (max-width: ${breakpoints.sm}px) {
    width: 380px;
    height: 380px;
    right: -5%;
  }
`

// Bubble configuration - circular bubbles of different sizes
const bubbles = [
  { x: 15, y: 20, delay: 0, size: 100 },
  { x: 35, y: 15, delay: 0.8, size: 85 },
  { x: 55, y: 25, delay: 1.6, size: 95 },
  { x: 75, y: 18, delay: 2.4, size: 80 },
  { x: 20, y: 45, delay: 0.4, size: 90 },
  { x: 40, y: 50, delay: 1.2, size: 105 },
  { x: 60, y: 42, delay: 2.0, size: 88 },
  { x: 80, y: 48, delay: 2.8, size: 75 },
  { x: 25, y: 70, delay: 0.6, size: 95 },
  { x: 45, y: 75, delay: 1.4, size: 92 },
  { x: 65, y: 68, delay: 2.2, size: 85 },
  { x: 10, y: 85, delay: 0.2, size: 82 },
  { x: 30, y: 80, delay: 1.0, size: 98 },
  { x: 50, y: 88, delay: 1.8, size: 88 },
  // Add more small bubbles to enhance the bubble effect
  { x: 12, y: 35, delay: 0.3, size: 60 },
  { x: 42, y: 28, delay: 1.1, size: 65 },
  { x: 68, y: 35, delay: 1.9, size: 58 },
  { x: 22, y: 58, delay: 0.7, size: 70 },
  { x: 58, y: 62, delay: 1.5, size: 68 },
  { x: 78, y: 72, delay: 2.3, size: 62 },
]

// Pulse node
const pulseNodes = [
  { x: 18, y: 22, delay: 0 },
  { x: 42, y: 18, delay: 0.7 },
  { x: 68, y: 25, delay: 1.4 },
  { x: 22, y: 48, delay: 0.5 },
  { x: 58, y: 45, delay: 1.2 },
  { x: 28, y: 72, delay: 0.9 },
  { x: 52, y: 78, delay: 1.6 },
]

// Irregular flowing paths
const flowPaths = [
  { d: 'M10,20 Q30,10 50,20 T90,20', delay: 0 },
  { d: 'M15,45 Q35,35 55,45 T95,45', delay: 1 },
  { d: 'M20,70 Q40,60 60,70 T100,70', delay: 2 },
  { d: 'M5,50 Q25,40 45,50 T85,50', delay: 0.5 },
  { d: 'M25,85 Q45,75 65,85 T105,85', delay: 1.5 },
]

// Use memo to optimize component and avoid unnecessary re-renders
const BubbleItem = memo(({ bubble, isDark }: { bubble: (typeof bubbles)[0]; isDark: boolean }) => (
  <Bubble $x={bubble.x} $y={bubble.y} $delay={bubble.delay} $size={bubble.size} $isDark={isDark} />
))
BubbleItem.displayName = 'BubbleItem'

const PulseNodeItem = memo(({ node, isDark }: { node: (typeof pulseNodes)[0]; isDark: boolean }) => (
  <PulseNode $x={node.x} $y={node.y} $delay={node.delay} $isDark={isDark} />
))
PulseNodeItem.displayName = 'PulseNodeItem'

const FlowPathItem = memo(({ path }: { path: (typeof flowPaths)[0] }) => <FlowPath d={path.d} $delay={path.delay} />)
FlowPathItem.displayName = 'FlowPathItem'

export function GeometricBackground() {
  const isDark = useIsDarkMode()

  // Use useMemo to cache data and avoid creating new arrays on every render
  const memoizedBubbles = useMemo(() => bubbles, [])
  const memoizedPulseNodes = useMemo(() => pulseNodes, [])
  const memoizedFlowPaths = useMemo(() => flowPaths, [])

  return (
    <BackgroundContainer>
      {/* Bubble effect - circular bubble floating animation */}
      {memoizedBubbles.map((bubble, index) => (
        <BubbleItem key={`bubble-${index}`} bubble={bubble} isDark={isDark} />
      ))}

      {/* Flowing lines */}
      <FlowSVG $isDark={isDark} viewBox="0 0 100 100" preserveAspectRatio="none">
        {memoizedFlowPaths.map((path, index) => (
          <FlowPathItem key={`flow-${index}`} path={path} />
        ))}
      </FlowSVG>

      {/* Pulse nodes */}
      {memoizedPulseNodes.map((node, index) => (
        <PulseNodeItem key={`pulse-${index}`} node={node} isDark={isDark} />
      ))}

      {/* Gradient orbs */}
      <GradientOrbTopLeft $delay="0s" $isDark={isDark} />
      <GradientOrbTopRight $delay="6s" $isDark={isDark} />
      <GradientOrbBottomLeft $delay="12s" $isDark={isDark} />
      <GradientOrbBottomRight $delay="18s" $isDark={isDark} />
    </BackgroundContainer>
  )
}
