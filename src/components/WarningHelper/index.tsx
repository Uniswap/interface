import React, { useCallback, useState } from 'react'
import { AlertTriangle } from 'react-feather'
import styled from 'styled-components'
import Tooltip from '../Tooltip'

const WarningWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  color: ${({ theme }) => theme.yellow2};
  transition: opacity 0.3s ease;
  width: 16px;
  height: 16px;

  :hover,
  :focus {
    opacity: 0.7;
  }
`

function QuestionHelper({ text }: { text: string }) {
  const [show, setShow] = useState<boolean>(false)

  const open = useCallback(() => setShow(true), [setShow])
  const close = useCallback(() => setShow(false), [setShow])

  return (
    <WarningWrapper onClick={open} onMouseEnter={open} onMouseLeave={close}>
      <Tooltip text={text} show={show}>
        <AlertTriangle size={16} />
      </Tooltip>
    </WarningWrapper>
  )
}

export default QuestionHelper
