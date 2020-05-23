import { transparentize } from 'polished'
import React from 'react'
import styled from 'styled-components'
import Popover, { PopoverProps } from '../Popover'

const TooltipContainer = styled.div`
  width: 228px;
  padding: 0.6rem 1rem;
  line-height: 150%;
  background: ${({ theme }) => theme.bg2};
  border: 1px solid ${({ theme }) => theme.bg3};
  box-shadow: 0 4px 8px 0 ${({ theme }) => transparentize(0.9, theme.shadow1)};

  border-radius: 8px;

  color: ${({ theme }) => theme.text2};
  font-weight: 400;
`

interface TooltipProps extends Omit<PopoverProps, 'content'> {
  text: string
}

export default function Tooltip({ text, ...rest }: TooltipProps) {
  return <Popover content={<TooltipContainer>{text}</TooltipContainer>} {...rest} />
}
