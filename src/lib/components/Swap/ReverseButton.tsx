import { useAtom } from 'jotai'
import { ArrowDown as ArrowDownIcon, ArrowUp as ArrowUpIcon } from 'lib/icons'
import { stateAtom } from 'lib/state/swap'
import styled, { Layer } from 'lib/theme'
import { useCallback, useState } from 'react'

import Button from '../Button'
import Row from '../Row'

const ReverseRow = styled(Row)`
  bottom: -1.5em;
  position: absolute;
  width: 100%;
  z-index: ${Layer.OVERLAY};
`

const ArrowUp = styled(ArrowUpIcon)`
  left: calc(50% - 0.37em);
  position: absolute;
  top: calc(50% - 0.82em);
`

const ArrowDown = styled(ArrowDownIcon)`
  bottom: calc(50% - 0.82em);
  position: absolute;
  right: calc(50% - 0.37em);
`

const Overlay = styled.div`
  background-color: ${({ theme }) => theme.container};
  border-radius: ${({ theme }) => theme.borderRadius}em;
  padding: 0.25em;
`

const StyledReverseButton = styled(Button)<{ turns: number }>`
  border-radius: ${({ theme }) => theme.borderRadius * 0.75}em;
  height: 2.5em;
  position: relative;
  width: 2.5em;

  div {
    transform: rotate(${({ turns }) => turns / 2}turn);
    transition: transform 0.25s ease-in-out;
    will-change: transform;
  }
`

export default function ReverseButton({ disabled }: { disabled?: boolean }) {
  const [state, setState] = useAtom(stateAtom)
  const [turns, setTurns] = useState(0)
  const onClick = useCallback(() => {
    const { input, output } = state
    setState((state) => {
      state.input = output
      state.output = input
    })
    setTurns((turns) => ++turns)
  }, [state, setState])

  return (
    <ReverseRow justify="center">
      <Overlay>
        <StyledReverseButton disabled={disabled} onClick={onClick} turns={turns}>
          <div>
            <ArrowUp strokeWidth={3} />
            <ArrowDown strokeWidth={3} />
          </div>
        </StyledReverseButton>
      </Overlay>
    </ReverseRow>
  )
}
