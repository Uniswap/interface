import { Placement } from '@popperjs/core'
import { MouseoverTooltip } from 'components/Tooltip'
import styled from 'lib/styled-components'
import { ReactNode, useCallback, useState } from 'react'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'

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

export default function QuestionHelper({
  text,
  size = 16,
  placement,
}: {
  text: ReactNode
  size?: number
  placement?: Placement
}) {
  const [show, setShow] = useState<boolean>(false)

  const open = useCallback(() => setShow(true), [setShow])
  const close = useCallback(() => setShow(false), [setShow])
  return (
    <span style={{ marginLeft: 4, display: 'flex', alignItems: 'center' }}>
      <MouseoverTooltip text={text} forceShow={show} placement={placement}>
        <QuestionWrapper onClick={open} onMouseEnter={open} onMouseLeave={close}>
          <QuestionMark>
            <InfoCircleFilled size={size} color="$neutral3" />
          </QuestionMark>
        </QuestionWrapper>
      </MouseoverTooltip>
    </span>
  )
}
