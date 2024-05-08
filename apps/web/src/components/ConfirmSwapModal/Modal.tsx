import { InterfaceModalName } from '@uniswap/analytics-events'
import { Trace } from 'analytics'
import { AutoColumn } from 'components/Column'
import { ConfirmModalState } from 'components/ConfirmSwapModal'
import Modal from 'components/Modal'
import { PropsWithChildren, useRef } from 'react'
import { animated, easings, useSpring } from 'react-spring'
import styled from 'styled-components'
import { TRANSITION_DURATIONS } from 'theme/styles'
import useResizeObserver from 'use-resize-observer'

const AnimatedContainer = styled(animated.div)`
  width: 100%;
  height: auto;
  min-width: min-content;
  will-change: height;
  overflow: hidden;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.surface1};
  @media screen and (max-width: ${({ theme }) => theme.breakpoint.sm}px) {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }
`
const Content = styled(AutoColumn)`
  background-color: ${({ theme }) => theme.surface1};
  width: 100%;
  padding: 8px;
  gap: 12px;
`

export function SwapModal({
  children,
  confirmModalState,
  onDismiss,
}: PropsWithChildren<{
  confirmModalState: ConfirmModalState
  onDismiss: () => void
}>) {
  const prevConfirmModalState = useRef(confirmModalState)
  const { ref, height } = useResizeObserver()
  const springProps = useSpring({
    height,
    onRest: () => (prevConfirmModalState.current = confirmModalState),
    config: {
      mass: 1.2,
      tension: 300,
      friction: 30,
      clamp: true,
      velocity: 0.01,
      duration: TRANSITION_DURATIONS.medium,
      easing: easings.easeInOutCubic,
    },
  })

  return (
    <Trace modal={InterfaceModalName.CONFIRM_SWAP}>
      <Modal isOpen $scrollOverlay onDismiss={onDismiss} maxHeight={90} slideIn>
        <AnimatedContainer style={prevConfirmModalState.current !== confirmModalState ? springProps : undefined}>
          <div ref={ref}>
            <Content>{children}</Content>
          </div>
        </AnimatedContainer>
      </Modal>
    </Trace>
  )
}
