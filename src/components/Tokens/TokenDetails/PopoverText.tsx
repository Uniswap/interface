import { Placement } from '@popperjs/core'
import Tooltip from 'components/Tooltip'
import { PropsWithChildren, ReactNode, useCallback, useState } from 'react'
import styled from 'styled-components/macro'

const PopoverTextContainer = styled.div`
  display: flex;
  position: relative;
  align-items: center;
  cursor: help;
`

const PopoverTextBody = styled.div`
  color: ${({ theme }) => theme.textPrimary};
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
`

const PopoverTextWrapper = styled.div`
  margin-left: 4px;
  display: flex;
  align-items: center;
`

type PopoverTextProps = PropsWithChildren<{ text?: ReactNode; placement?: Placement }>
export default function PopoverText({ text, placement, children }: PopoverTextProps) {
  const [show, setShow] = useState<boolean>(false)

  const open = useCallback(() => setShow(true), [setShow])
  const close = useCallback(() => setShow(false), [setShow])
  if (!text) return <>{children}</>
  return (
    <PopoverTextWrapper>
      <Tooltip text={<PopoverTextBody>{text}</PopoverTextBody>} show={show} placement={placement}>
        <PopoverTextContainer onClick={open} onMouseEnter={open} onMouseLeave={close}>
          {children}
        </PopoverTextContainer>
      </Tooltip>
    </PopoverTextWrapper>
  )
}
