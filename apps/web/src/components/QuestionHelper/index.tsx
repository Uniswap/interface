import { ReactNode, useCallback, useState } from 'react'
import { HelpCircle } from 'react-feather'
import styled from 'styled-components'

import Tooltip from '../Tooltip'

const QuestionWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0px;
  width: 18px;
  height: 18px;
  border: none;
  background: none;
  outline: none;
  cursor: default;
  border-radius: 36px;
  font-size: 12px;
  border-radius: 12px;

  :hover,
  :focus {
    opacity: 0.7;
  }
`

const QuestionMark = styled.span`
  font-size: 14px;
  margin-left: 8px;
  align-items: center;
  color: ${({ theme }) => theme.neutral2};
  margin-top: 2.5px;
`

export default function QuestionHelper({ text }: { text: ReactNode; size?: number }) {
  const [show, setShow] = useState<boolean>(false)

  const open = useCallback(() => setShow(true), [setShow])
  const close = useCallback(() => setShow(false), [setShow])
  return (
    <span style={{ marginLeft: 4, display: 'flex', alignItems: 'center' }}>
      <Tooltip text={text} show={show}>
        <QuestionWrapper onClick={open} onMouseEnter={open} onMouseLeave={close}>
          <QuestionMark>
            <HelpCircle size={16} />
          </QuestionMark>
        </QuestionWrapper>
      </Tooltip>
    </span>
  )
}
