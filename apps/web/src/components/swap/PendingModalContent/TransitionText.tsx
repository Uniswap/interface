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
  onTransition?: () => void
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
  transitionTimeMs = 1500,
  onTransition,
}: TransitionTextProps) {
  const [transitioned, setTransitioned] = useState(false)

  useEffect(() => {
    // Transition from initial text to transition text.
    const timeout = setTimeout(() => {
      if (!transitioned) {
        setTransitioned(true)
        onTransition?.()
      }
    }, transitionTimeMs)

    return () => clearTimeout(timeout)
  }, [onTransition, transitionTimeMs, transitioned])

  const initialTextRef = useRef<HTMLDivElement>(null)
  useUnmountingAnimation(initialTextRef, () => AnimationType.EXITING)

  return (
    <Container>
      {!transitioned && (
        <InitialTextContainer ref={initialTextRef}>
          <Trans>{initialText}</Trans>
        </InitialTextContainer>
      )}
      {transitioned && (
        <TransitionTextContainer>
          <Trans>{transitionText}</Trans>
        </TransitionTextContainer>
      )}
    </Container>
  )
}
