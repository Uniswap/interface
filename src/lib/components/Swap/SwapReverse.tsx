import styled, { icon } from 'lib/theme'
import { ArrowDown, ArrowUp } from 'react-feather'

import Button from '../Button'
import Row from '../Row'

const SwapReverseRow = styled(Row)`
  position: absolute;
  top: calc(-20px - 0.25em);
  width: 100%;
`

const ArrowUpIcon = styled(icon(ArrowUp, { color: 'primary' }))`
  position: absolute;
  right: 8px;
  top: 6px;
`

const ArrowDownIcon = styled(icon(ArrowDown, { color: 'primary' }))`
  bottom: 6px;
  left: 8px;
  position: absolute;
`

const Overlay = styled.div`
  background-color: ${({ theme }) => theme.container};
  border-radius: ${({ theme }) => theme.borderRadius}em;
  padding: 0.25em;
`

const SwapButton = styled(Button)`
  background-color: ${({ theme }) => theme.interactive};
  border-radius: ${({ theme }) => theme.borderRadius - 0.25}em;
  height: 40px;
  position: relative;
  width: 40px;

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

export default function SwapReverse({ onClick }: { onClick: () => void }) {
  return (
    <SwapReverseRow justify="center">
      <Overlay>
        <SwapButton onClick={onClick}>
          <ArrowUpIcon />
          <ArrowDownIcon />
        </SwapButton>
      </Overlay>
    </SwapReverseRow>
  )
}
