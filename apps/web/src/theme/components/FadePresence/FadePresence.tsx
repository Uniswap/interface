import { cn } from '@universe/mycelium'
import { styled } from '@universe/mycelium/styled'
import { type CSSProperties, useRef } from 'react'
import { useUnmountingAnimation } from '~/theme/components/FadePresence/hooks/useUnmountingAnimation'

export enum AnimationType {
  EXITING = 'exiting',
}

export enum FadePresenceAnimationType {
  Fade = 'fade',
  FadeAndScale = 'scale',
  FadeAndTranslate = 'translate',
}

const FadeWrapper = styled('div', {
  platform: 'web',
  base: 'fade-presence',
  variants: {
    animationType: {
      [FadePresenceAnimationType.Fade]: 'fade-presence-fade',
      [FadePresenceAnimationType.FadeAndScale]: 'fade-presence-scale',
      [FadePresenceAnimationType.FadeAndTranslate]: 'fade-presence-translate',
    },
  },
  defaultVariants: { animationType: FadePresenceAnimationType.Fade },
})

// TODO(INFRA-4080): replace with Mycelium `Presence` once it has duration/delay/z-index knobs and a
// spore scale enter/exit pair; that issue also reconciles the `@deprecated` target below.
/**
 * @deprecated Use `AnimateTransition` or `TransitionItem` from `ui/src` instead. This wrapper uses
 * `useUnmountingAnimation`, which can leave exiting nodes in normal flow and stack oddly beside
 * newly mounted siblings.
 */
export function FadePresence({
  children,
  className,
  animationType = FadePresenceAnimationType.Fade,
  transitionDuration,
  delay,
  zIndex,
  ...rest
}: {
  children: React.ReactNode
  className?: string
  animationType?: FadePresenceAnimationType
  transitionDuration?: string
  delay?: string
  zIndex?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  useUnmountingAnimation({ node: ref, getAnimatingClass: () => AnimationType.EXITING })
  return (
    <FadeWrapper
      ref={ref}
      className={cn(delay && 'fade-presence-delayed', className)}
      style={
        {
          '--fade-presence-duration': transitionDuration,
          '--fade-presence-delay': delay,
          ...(zIndex ? { zIndex } : undefined),
        } as CSSProperties
      }
      animationType={animationType}
      {...rest}
    >
      {children}
    </FadeWrapper>
  )
}
