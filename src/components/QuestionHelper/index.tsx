import { RedesignVariant, useRedesignFlag } from 'featureFlags/flags/redesign'
import { ReactNode, useCallback, useState } from 'react'
import { HelpCircle } from 'react-feather'
import styled from 'styled-components/macro'

import Tooltip from '../Tooltip'

const QuestionWrapper = styled.div<{ redesignFlag: boolean }>`
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
  border-radius: ${({ redesignFlag }) => redesignFlag && '12px'};
  color: ${({ theme, redesignFlag }) => !redesignFlag && theme.deprecated_text2};

  :hover,
  :focus {
    opacity: 0.7;
  }
`

const QuestionMark = styled.span<{ redesignFlag?: boolean }>`
  font-size: 14px;
  margin-left: ${({ redesignFlag }) => redesignFlag && '8px'};
  align-items: ${({ redesignFlag }) => redesignFlag && 'center'};
  color: ${({ theme, redesignFlag }) => redesignFlag && theme.textSecondary};
  margin-top: ${({ redesignFlag }) => redesignFlag && '2.5px'};
`

export default function QuestionHelper({ text }: { text: ReactNode; size?: number }) {
  const [show, setShow] = useState<boolean>(false)

  const open = useCallback(() => setShow(true), [setShow])
  const close = useCallback(() => setShow(false), [setShow])
  const redesignFlag = useRedesignFlag()
  const redesignFlagEnabled = redesignFlag === RedesignVariant.Enabled
  return (
    <span style={{ marginLeft: 4, display: 'flex', alignItems: 'center' }}>
      <Tooltip text={text} show={show}>
        <QuestionWrapper onClick={open} onMouseEnter={open} onMouseLeave={close} redesignFlag={redesignFlagEnabled}>
          <QuestionMark redesignFlag={redesignFlagEnabled}>
            {redesignFlagEnabled ? <HelpCircle size={16}></HelpCircle> : '?'}
          </QuestionMark>
        </QuestionWrapper>
      </Tooltip>
    </span>
  )
}
