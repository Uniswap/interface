import React from 'react'
import styled from 'styled-components'

import { TYPE } from '../../theme'
import { RowBetween } from '../Row'
import Settings from '../Settings'

const StyledSwapHeader = styled.div`
  padding: 12px 1rem 0px 1.5rem;
  margin-bottom: -4px;
  width: 100%;
  max-width: 420px;
  color: ${({ theme }) => theme.text2};
`

export default function SwapHeader({
  title = 'Swap',
  hideSettings = false,
}: {
  title?: string
  hideSettings?: boolean
}) {
  return (
    <StyledSwapHeader>
      <RowBetween>
        <TYPE.black my={2} fontWeight={500}>
          {title}
        </TYPE.black>
        {hideSettings || <Settings />}
      </RowBetween>
    </StyledSwapHeader>
  )
}
