import { useAtom } from 'jotai'
import styled, { icon, Layer } from 'lib/theme'
import { useCallback } from 'react'
import { ArrowDown, ArrowUp } from 'react-feather'

import Button from '../Button'
import Row from '../Row'
import { swapAtom } from './state'

const ReverseRow = styled(Row)`
  bottom: -1.5em;
  position: absolute;
  width: 100%;
  z-index: ${Layer.OVERLAY};
`

const ArrowUpIcon = styled(icon(ArrowUp, { color: 'primary' }))`
  position: absolute;
  right: 0.5em;
  top: 0.375em;
`

const ArrowDownIcon = styled(icon(ArrowDown, { color: 'primary' }))`
  bottom: 0.375em;
  left: 0.5em;
  position: absolute;
`

const Overlay = styled.div`
  background-color: ${({ theme }) => theme.container};
  border-radius: ${({ theme }) => theme.borderRadius}em;
  padding: 0.25em;
`

const StyledReverseButton = styled(Button)`
  background-color: ${({ theme }) => theme.interactive};
  border-radius: ${({ theme }) => theme.borderRadius * 0.75}em;
  height: 2.5em;
  position: relative;
  width: 2.5em;

  > * {
    stroke-width: 4;
  }

  :hover {
    cursor: pointer;
  }

  :hover > * {
    opacity: 0.7;
  }
`

export default function ReverseButton() {
  const [swap, setSwap] = useAtom(swapAtom)
  const onClick = useCallback(() => {
    const { input, output } = swap
    setSwap((swap) => {
      swap.input = output
      swap.output = input
    })
  }, [swap, setSwap])

  return (
    <ReverseRow justify="center">
      <Overlay>
        <StyledReverseButton onClick={onClick}>
          <ArrowUpIcon />
          <ArrowDownIcon />
        </StyledReverseButton>
      </Overlay>
    </ReverseRow>
  )
}
