import { Placement } from '@popperjs/core'
import { useCallback, useState } from 'react'
import { Info } from 'react-feather'
import { Flex } from 'rebass'
import styled from 'styled-components'

import Tooltip from 'components/Tooltip'
import useTheme from 'hooks/useTheme'

const QuestionWrapper = styled.div<{ useCurrentColor?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  outline: none;
  cursor: default;
  border-radius: 36px;
  color: ${({ theme, useCurrentColor }) => (useCurrentColor ? 'inherit' : theme.text2)};

  :hover,
  :focus {
    opacity: 0.7;
  }
`

export default function QuestionHelper({
  text,
  color,
  size = 12,
  useCurrentColor,
  placement,
}: {
  text: string
  color?: string
  size?: number
  useCurrentColor?: boolean
  placement?: Placement
}) {
  const [show, setShow] = useState<boolean>(false)

  const open = useCallback(() => setShow(true), [setShow])
  const close = useCallback(() => setShow(false), [setShow])
  const theme = useTheme()

  return (
    <Flex as="span" marginLeft="0.25rem" alignItems="center">
      <Tooltip placement={placement} text={text} show={show}>
        <QuestionWrapper onClick={open} onMouseEnter={open} onMouseLeave={close} useCurrentColor={useCurrentColor}>
          <Info size={size} color={useCurrentColor ? undefined : color || theme.subText} />
        </QuestionWrapper>
      </Tooltip>
    </Flex>
  )
}
