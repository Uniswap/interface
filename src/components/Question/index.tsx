import React, { useState } from 'react'
import styled, { keyframes } from 'styled-components'
import { HelpCircle as Question } from 'react-feather'

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

  color: ${({ theme }) => theme.text2};
  font-weight: 400;
  /* font-style: italic; */

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
        <Question size={16} />
      </QuestionWrapper>
      {showPopup && <Popup>{text}</Popup>}
    </Wrapper>
  )
}
