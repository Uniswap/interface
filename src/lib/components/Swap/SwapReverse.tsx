import styled, { icon } from 'lib/theme'
import Layer from 'lib/theme/layer'
import { ArrowDown, ArrowUp } from 'react-feather'

import Button from '../Button'
import Row from '../Row'

const SwapReverseRow = styled(Row)`
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

const SwapButton = styled(Button)`
  background-color: ${({ theme }) => theme.interactive};
  border-radius: ${({ theme }) => theme.borderRadius - 0.25}em;
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
