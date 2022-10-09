import styled from 'styled-components'

import { TYPE } from '../../theme'
import { RowBetween } from '../Row'
import Settings from '../Settings'

const StyledSwapHeader = styled.div`
  padding: 12px 1rem 0px 1.5rem;
  margin-bottom: -4px;
  width: 100%;
  /* max-width: 420px; */
  color: ${({ theme }) => theme.text2};

  background: rgba(51, 51, 51, 0.5);
  box-shadow: 0px -2px 0px #39e1ba;
  backdrop-filter: blur(2rem);
  border-radius: 1.6rem;
`

export default function SwapHeader() {
  return (
    <StyledSwapHeader>
      <RowBetween>
        <TYPE.black fontWeight={400} fontSize={'.7rem'} sx={{ fontFamily: 'Dela Gothic One', color: '#FFFFFF' }}>
          Swap
        </TYPE.black>
        <Settings />
      </RowBetween>
    </StyledSwapHeader>
  )
}
