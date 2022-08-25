import React from 'react'
import styled from 'styled-components'
import Settings from '../Settings'
import { RowBetween } from '../Row'
import { TYPE } from '../../theme'
import swapTopLine from '../../assets/images/tele/swapTopLine.svg'

const StyledSwapHeader = styled.div`
  padding: 12px 1rem 0px 1.5rem;
  margin-bottom: -4px;
  width: 100%;
  /* max-width: 420px; */
  color: ${({ theme }) => theme.text2};
  background: url(${swapTopLine}) top center no-repeat;
  background-size: 100%;
`

export default function SwapHeader() {
  return (
    <StyledSwapHeader>
      <RowBetween>
        {/* <TYPE.black fontWeight={500}>Swap</TYPE.black> */}
        <TYPE.black fontWeight={500}></TYPE.black>
        <Settings />
      </RowBetween>
    </StyledSwapHeader>
  )
}
