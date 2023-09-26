import { Trans } from '@lingui/macro'
import { useUnmountingAnimation } from 'hooks/useUnmountingAnimation'
import { ReactNode, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

import { slideInAnimation, slideOutAnimation } from './animations'
import { AnimationType } from './Logos'

interface TransitionTextProps {
  initialText: ReactNode
  transitionText: ReactNode
  transitionTimeMs?: number
  onTransitionEnded?: () => void
}

const Container = styled.div`
  position: relative;
  width: 100%;
  min-height: 30px;
`

const InitialTextContainer = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  transition: display ${({ theme }) => `${theme.transition.duration.fast} ${theme.transition.timing.inOut}`};
  ${slideInAnimation}
  &.${AnimationType.EXITING} {
    ${slideOutAnimation}
  }
`

const TransitionTextContainer = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  transition: display ${({ theme }) => `${theme.transition.duration.fast} ${theme.transition.timing.inOut}`};
  ${slideInAnimation}
  &.${AnimationType.EXITING} {
    ${slideOutAnimation}
  }
`

export function TransitionText({
  initialText,
  transitionText,
  transitionTimeMs = 1000,
  onTransitionEnded,
}: TransitionTextProps) {
  const [transitioned, setTransitioned] = useState(false)
  const [transitionEnded, setTransitionEnded] = useState(false)

  useEffect(() => {
    // Transition from initial text to transition text.
    const timeout = setTimeout(() => {
      setTransitioned(true)
    }, transitionTimeMs)

    return () => clearTimeout(timeout)
  }, [transitionTimeMs])

  useEffect(() => {
    // Show the transition text for a bit before removing it.
    if (transitioned) {
      const timeout = setTimeout(() => {
        setTransitionEnded(true)
      }, transitionTimeMs)
      return () => clearTimeout(timeout)
    }
    return
  }, [transitionTimeMs, transitioned])

  useEffect(() => {
    // Delay the onTransitionEnded callback until the transition has ended.
    if (transitioned && transitionEnded) {
      const timeout = setTimeout(() => {
        onTransitionEnded?.()
      }, 125 /* theme.transition.duration.fast */)
      return () => clearTimeout(timeout)
    }
    return
  }, [onTransitionEnded, transitionEnded, transitionTimeMs, transitioned])

  const initialTextRef = useRef<HTMLDivElement>(null)
  const transitionTextRef = useRef<HTMLDivElement>(null)
  useUnmountingAnimation(initialTextRef, () => AnimationType.EXITING)
  useUnmountingAnimation(transitionTextRef, () => AnimationType.EXITING)

  return (
    <Container>
      {!transitioned && (
        <InitialTextContainer ref={initialTextRef}>
          <Trans>{initialText}</Trans>
        </InitialTextContainer>
      )}
      {transitioned && !transitionEnded && (
        <TransitionTextContainer ref={transitionTextRef}>
          <Trans>{transitionText}</Trans>
        </TransitionTextContainer>
      )}
    </Container>
  )
}
