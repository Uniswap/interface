import React, { useState } from 'react'
import { HelpCircle as Question } from 'react-feather'
import styled from 'styled-components'
import Tooltip from '../Tooltip'

const QuestionWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
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

export default function QuestionHelper({ text }: { text: string }) {
  const [showPopup, setShowPopup] = useState<boolean>(false)

  return (
    <span style={{ marginLeft: 4 }}>
      <Tooltip text={text} showPopup={showPopup}>
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
        >
          <Question size={16} />
        </QuestionWrapper>
      </Tooltip>
    </span>
  )
}
