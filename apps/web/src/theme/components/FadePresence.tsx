import { useUnmountingAnimation } from 'hooks/useUnmountingAnimation'
import { css, deprecatedStyled, keyframes } from 'lib/styled-components'
import { useRef } from 'react'

const fadeIn = keyframes`
  from { opacity: 0;}
  to { opacity: 1;}
`
const fadeAndScaleIn = keyframes`
  from { opacity: 0; transform: scale(0); }
  to { opacity: 1; transform: scale(1); }
`
const fadeAndTranslateUpIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`
const fadeInAnimation = css<{ $transitionDuration?: string }>`
  animation: ${fadeIn}
    ${({ theme, $transitionDuration }) =>
      `${$transitionDuration ?? theme.transition.duration.medium} ${theme.transition.timing.inOut}`}
    forwards;
`
const fadeAndScaleInAnimation = css<{ $transitionDuration?: string }>`
  animation: ${fadeAndScaleIn}
    ${({ theme, $transitionDuration }) =>
      `${$transitionDuration ?? theme.transition.duration.medium} ${theme.transition.timing.inOut}`}
    forwards;
`
const fadeAndTranslateUpAnimation = css<{ $transitionDuration?: string }>`
  animation: ${fadeAndTranslateUpIn}
    ${({ theme, $transitionDuration }) =>
      `${$transitionDuration ?? theme.transition.duration.medium} ${theme.transition.timing.inOut}`}
    forwards;
`

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0;  }
`
const fadeAndScaleOut = keyframes`
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(0); }
`
const fadeAndTranslateDownOut = keyframes`
  from {opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(10px); }
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
const fadeAndTranslateDownAnimation = css<{ $transitionDuration?: string }>`
  animation: ${fadeAndTranslateDownOut}
    ${({ theme, $transitionDuration }) =>
      `${$transitionDuration ?? theme.transition.duration.medium} ${theme.transition.timing.inOut}`};
`

export enum AnimationType {
  EXITING = 'exiting',
}

export enum FadePresenceAnimationType {
  Fade = 'fade',
  FadeAndScale = 'scale',
  FadeAndTranslate = 'translate',
}

function getEntranceAnimationCss(animationType: FadePresenceAnimationType) {
  switch (animationType) {
    case FadePresenceAnimationType.FadeAndScale:
      return fadeAndScaleInAnimation
    case FadePresenceAnimationType.FadeAndTranslate:
      return fadeAndTranslateUpAnimation
    case FadePresenceAnimationType.Fade:
    default:
      return fadeInAnimation
  }
}

function getExitAnimationCss(animationType: FadePresenceAnimationType) {
  switch (animationType) {
    case FadePresenceAnimationType.FadeAndScale:
      return fadeAndScaleOutAnimation
    case FadePresenceAnimationType.FadeAndTranslate:
      return fadeAndTranslateDownAnimation
    case FadePresenceAnimationType.Fade:
    default:
      return fadeOutAnimation
  }
}

function getAnimationDelayCss($animationDelay: string, animationType: FadePresenceAnimationType) {
  switch (animationType) {
    case FadePresenceAnimationType.FadeAndTranslate:
      return css`
        animation-delay: ${$animationDelay};
        opacity: 0;
        translate: translateY(10px);
      `
    case FadePresenceAnimationType.FadeAndScale:
    case FadePresenceAnimationType.Fade:
    default:
      return css`
        animation-delay: ${$animationDelay};
        opacity: 0;
      `
  }
}

const FadeWrapper = deprecatedStyled.div<{
  animationType: FadePresenceAnimationType
  $transitionDuration?: string
  $animationDelay?: string
  $zIndex?: number
}>`
  transition:
    display
      ${({ theme, $transitionDuration }) =>
        `${$transitionDuration ?? theme.transition.duration.medium} ${theme.transition.timing.inOut}`},
    transform
      ${({ theme, $transitionDuration }) =>
        `${$transitionDuration ?? theme.transition.duration.medium} ${theme.transition.timing.inOut}`};
  ${({ animationType }) => getEntranceAnimationCss(animationType)}

  ${({ $animationDelay, animationType }) => $animationDelay && getAnimationDelayCss($animationDelay, animationType)};

  &.${AnimationType.EXITING} {
    ${({ animationType }) => getExitAnimationCss(animationType)}
  }
  ${({ $zIndex }) => $zIndex && `z-index: ${$zIndex};`}
`

export function FadePresence({
  children,
  className,
  animationType = FadePresenceAnimationType.Fade,
  $transitionDuration,
  $delay,
  $zIndex,
  ...rest
}: {
  children: React.ReactNode
  className?: string
  animationType?: FadePresenceAnimationType
  $transitionDuration?: string
  $delay?: string
  $zIndex?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  useUnmountingAnimation({ node: ref, getAnimatingClass: () => AnimationType.EXITING })
  return (
    <FadeWrapper
      ref={ref}
      className={className}
      $transitionDuration={$transitionDuration}
      $animationDelay={$delay}
      animationType={animationType}
      $zIndex={$zIndex}
      {...rest}
    >
      {children}
    </FadeWrapper>
  )
}
