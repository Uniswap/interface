import React, { useState } from 'react'
import styled, { keyframes } from 'styled-components'

import question from '../../assets/images/question.svg'

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

  :hover,
  :focus {
    opacity: 0.7;
  }
`

const HelpCircleStyled = styled.img`
  height: 24px;
  width: 23px;
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
  position: absolute;
  width: 228px;
  z-index: 9999;
  left: 40px;
  top: -10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.6rem 1rem;
  line-height: 150%;
  background: ${({ theme }) => theme.bg1};
  border: 1px solid ${({ theme }) => theme.bg3};

  border-radius: 8px;

  animation: ${fadeIn} 0.15s linear;

  color: ${({ theme }) => theme.text1};
  font-style: italic;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    left: -20px;
  `}
`

export default function QuestionHelper({ text }) {
  const [showPopup, setPopup] = useState(false)

  return (
    <Wrapper>
      <QuestionWrapper
        onClick={() => {
          setPopup(!showPopup)
        }}
        onMouseEnter={() => {
          setPopup(true)
        }}
        onMouseLeave={() => {
          setPopup(false)
        }}
      >
        <HelpCircleStyled src={question} alt="popup" />
      </QuestionWrapper>
      {showPopup && <Popup>{text}</Popup>}
    </Wrapper>
  )
}
