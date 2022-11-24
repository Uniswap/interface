import { Placement } from '@popperjs/core'
import { CSSProperties, ReactNode, useCallback, useState } from 'react'
import { Info } from 'react-feather'
import styled from 'styled-components'

import Tooltip from 'components/Tooltip'
import { Z_INDEXS } from 'constants/styles'

const InfoWrapper = styled.div<{ isActive?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  outline: none;
  cursor: default;
  border-radius: 36px;
  color: ${({ theme, isActive }) => (isActive ? theme.textReverse : theme.subText)};

  :hover,
  :focus {
    opacity: 0.7;
  }
`

const InfoHelperWrapper = styled.span`
  display: inline-flex;
  justify-content: center;
  align-items: center;
  margin-left: 0.25rem;
  line-height: 100%;
  vertical-align: middle;
`

export default function InfoHelper({
  text,
  size,
  isActive = false,
  color,
  placement,
  width,
  style,
  zIndexTooltip = Z_INDEXS.POPOVER_CONTAINER,
}: {
  text: string | ReactNode
  size?: number
  isActive?: boolean
  color?: string
  placement?: Placement
  width?: string
  style?: CSSProperties
  zIndexTooltip?: number
}) {
  const [show, setShow] = useState<boolean>(false)

  const open = useCallback(() => setShow(true), [setShow])
  const close = useCallback(() => setShow(false), [setShow])

  return (
    <InfoHelperWrapper style={style}>
      <Tooltip
        text={text}
        show={show}
        placement={placement}
        width={width}
        size={size}
        style={{ zIndex: zIndexTooltip }}
      >
        <InfoWrapper onClick={open} onMouseEnter={open} onMouseLeave={close} isActive={isActive}>
          <Info size={size || 12} color={color} />
        </InfoWrapper>
      </Tooltip>
    </InfoHelperWrapper>
  )
}
