import styled from 'lib/theme'
import { StyledButton, styledIcon } from 'lib/theme/components'
import { ArrowDown, ArrowUp } from 'react-feather'

import Row from '../Row'

const SwapReverseRow = styled(Row)`
  position: absolute;
  top: calc(-20px - 0.25em);
  width: 100%;
`

const StyledArrowUp = styled(styledIcon(ArrowUp, 'primary'))`
  position: absolute;
  right: 8px;
  top: 6px;
`

const StyledArrowDown = styled(styledIcon(ArrowDown, 'primary'))`
  bottom: 6px;
  left: 8px;
  position: absolute;
`

const Overlay = styled.div`
  background-color: ${({ theme }) => theme.container};
  border-radius: ${({ theme }) => theme.borderRadius}em;
  padding: 0.25em;
`

const SwapIcon = styled(StyledButton)`
  background-color: ${({ theme }) => theme.interactive};
  border-radius: ${({ theme }) => theme.borderRadius}em;
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
        <SwapIcon onClick={onClick}>
          <StyledArrowUp />
          <StyledArrowDown />
        </SwapIcon>
      </Overlay>
    </SwapReverseRow>
  )
}
