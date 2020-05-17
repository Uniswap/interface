import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import styled, { keyframes } from 'styled-components'
import { HelpCircle as Question } from 'react-feather'
import { usePopper } from 'react-popper'

const Wrapper = styled.div`
  position: relative;
`

const QuestionWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 0.4rem;
  padding: 0.2rem;
  border: none;
  background: none;
  outline: none;
  cursor: default;
  border-radius: 36px;
  background-color: ${({ theme }) => theme.bg2};
  color: ${({ theme }) => theme.text2};

  :hover,
  :focus {
    opacity: 0.7;
  }
`
const fadeIn = keyframes`
  from {
    opacity : 0;
  }

  to {
    opacity : 1;
  }
`

const Popup = styled.div`
  width: 228px;
  z-index: 9999;
  padding: 0.6rem 1rem;
  line-height: 150%;
  background: ${({ theme }) => theme.bg1};
  border: 1px solid ${({ theme }) => theme.bg3};

  border-radius: 8px;

  animation: ${fadeIn} 0.15s linear;

  color: ${({ theme }) => theme.text2};
  font-weight: 400;
`

export default function QuestionHelper({ text }: { text: string }) {
  const [showPopup, setShowPopup] = useState<boolean>(false)
  const [referenceElement, setReferenceElement] = useState(null)
  const [popperElement, setPopperElement] = useState(null)
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: 'auto',
    strategy: 'fixed'
  })

  const portal = createPortal(
    showPopup && (
      <Popup ref={setPopperElement} style={styles.popper} {...attributes.popper}>
        {text}
      </Popup>
    ),
    document.getElementById('popover-container')
  )

  return (
    <Wrapper>
      <QuestionWrapper
        onClick={() => {
          setShowPopup(true)
        }}
        onMouseEnter={() => {
          setShowPopup(true)
        }}
        onMouseLeave={() => {
          setShowPopup(false)
        }}
        ref={setReferenceElement}
      >
        <Question size={16} />
      </QuestionWrapper>
      {portal}
    </Wrapper>
  )
}
