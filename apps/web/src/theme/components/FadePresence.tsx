import { useUnmountingAnimation } from 'hooks/useUnmountingAnimation'
import { useRef } from 'react'
import styled, { css, keyframes } from 'styled-components'

const fadeIn = keyframes`
  from { opacity: 0;}
  to { opacity: 1;}
`
const fadeAndScaleIn = keyframes`
  from { opacity: 0; transform: scale(0); }
  to { opacity: 1; transform: scale(1); }
`
const fadeInAnimation = css<{ $transitionDuration?: string }>`
  animation: ${fadeIn}
    ${({ theme, $transitionDuration }) =>
      `${$transitionDuration ?? theme.transition.duration.medium} ${theme.transition.timing.inOut}`};
`
const fadeAndScaleInAnimation = css<{ $transitionDuration?: string }>`
  animation: ${fadeAndScaleIn}
    ${({ theme, $transitionDuration }) =>
      `${$transitionDuration ?? theme.transition.duration.medium} ${theme.transition.timing.inOut}`};
`

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0;  }
`
const fadeAndScaleOut = keyframes`
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(0); }
`
const fadeOutAnimation = css<{ $transitionDuration?: string }>`
  animation: ${fadeOut}
    ${({ theme, $transitionDuration }) =>
      `${$transitionDuration ?? theme.transition.duration.medium} ${theme.transition.timing.inOut}`};
`
const fadeAndScaleOutAnimation = css<{ $transitionDuration?: string }>`
  animation: ${fadeAndScaleOut}
    ${({ theme, $transitionDuration }) =>
      `${$transitionDuration ?? theme.transition.duration.medium} ${theme.transition.timing.inOut}`};
`

export enum AnimationType {
  EXITING = 'exiting',
}

const FadeWrapper = styled.div<{ $scale: boolean; $transitionDuration?: string }>`
  transition: display
      ${({ theme, $transitionDuration }) =>
        `${$transitionDuration ?? theme.transition.duration.medium} ${theme.transition.timing.inOut}`},
    transform
      ${({ theme, $transitionDuration }) =>
        `${$transitionDuration ?? theme.transition.duration.medium} ${theme.transition.timing.inOut}`};
  ${({ $scale }) => ($scale ? fadeAndScaleInAnimation : fadeInAnimation)}

  &.${AnimationType.EXITING} {
    ${({ $scale }) => ($scale ? fadeAndScaleOutAnimation : fadeOutAnimation)}
  }
`

export function FadePresence({
  children,
  className,
  $scale = false,
  $transitionDuration,
  ...rest
}: {
  children: React.ReactNode
  className?: string
  $scale?: boolean
  $transitionDuration?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  useUnmountingAnimation(ref, () => AnimationType.EXITING)
  return (
    <FadeWrapper ref={ref} className={className} $scale={$scale} $transitionDuration={$transitionDuration} {...rest}>
      {children}
    </FadeWrapper>
  )
}
