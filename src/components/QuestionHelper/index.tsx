import { Phase0Variant, usePhase0Flag } from 'featureFlags/flags/phase0'
import { ReactNode, useCallback, useState } from 'react'
import { HelpCircle } from 'react-feather'
import styled from 'styled-components/macro'

import Tooltip from '../Tooltip'

const QuestionWrapper = styled.div<{ phase0Flag: boolean }>`
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
  border-radius: ${({ phase0Flag }) => phase0Flag && '12px'};
  color: ${({ theme, phase0Flag }) => !phase0Flag && theme.deprecated_text2};

  :hover,
  :focus {
    opacity: 0.7;
  }
`

const QuestionMark = styled.span<{ phase0Flag?: boolean }>`
  font-size: 14px;
  margin-left: ${({ phase0Flag }) => phase0Flag && '8px'};
  align-items: ${({ phase0Flag }) => phase0Flag && 'center'};
  color: ${({ theme, phase0Flag }) => phase0Flag && theme.textSecondary};
  margin-top: ${({ phase0Flag }) => phase0Flag && '2.5px'};
`

export default function QuestionHelper({ text }: { text: ReactNode; size?: number }) {
  const [show, setShow] = useState<boolean>(false)

  const open = useCallback(() => setShow(true), [setShow])
  const close = useCallback(() => setShow(false), [setShow])
  const phase0Flag = usePhase0Flag()
  const phase0FlagEnabled = phase0Flag === Phase0Variant.Enabled
  return (
    <span style={{ marginLeft: 4, display: 'flex', alignItems: 'center' }}>
      <Tooltip text={text} show={show}>
        <QuestionWrapper onClick={open} onMouseEnter={open} onMouseLeave={close} phase0Flag={phase0FlagEnabled}>
          <QuestionMark phase0Flag={phase0FlagEnabled}>
            {phase0FlagEnabled ? <HelpCircle size={16}></HelpCircle> : '?'}
          </QuestionMark>
        </QuestionWrapper>
      </Tooltip>
    </span>
  )
}
