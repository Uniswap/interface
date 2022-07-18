import { DialogOverlay } from '@reach/dialog'
import { animated } from 'react-spring'
import styled from 'styled-components/macro'

import Confetti from '../Confetti'

const AnimatedDialogOverlay = animated(DialogOverlay)

const BigWrapBackground = styled(AnimatedDialogOverlay)`
  &[data-reach-dialog-overlay] {
    z-index: 2;
    background-color: black;
    opacity: 0.85;
  }
`

const BigWrap = styled(AnimatedDialogOverlay)`
  &[data-reach-dialog-overlay] {
    z-index: 2;
    background-color: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`

const PopUp = styled.div`
  position: absolute;
  height: 580px;
  top: 100px;
  z-index: 1;
  &::-webkit-scrollbar {
    display: none;
  }
  @media (max-width: 768px) {
    max-width: 95%;
  }
`

interface ModalProps {
  isOpen: boolean
  showConfetti: boolean
  onDismiss?: () => void
  minHeight?: boolean
  maxHeight?: number
  children?: React.ReactNode
}

export const ClaimsModal = (props: ModalProps) => {
  const { isOpen, showConfetti } = props

  return (
    <>
      {isOpen && (
        <>
          <BigWrapBackground>
            <Confetti start={showConfetti} />
          </BigWrapBackground>

          <BigWrap>
            <PopUp>{props.children}</PopUp>
          </BigWrap>
        </>
      )}
    </>
  )
}
