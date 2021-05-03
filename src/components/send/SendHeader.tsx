import React from 'react'
import styled from 'styled-components'

import { TYPE } from '../../theme'
import { RowBetween } from '../Row'

const StyledSendHeader = styled.div`
  padding: 12px 1rem 0px 1.5rem;
  margin-bottom: -4px;
  width: 100%;
  max-width: 420px;
  color: ${({ theme }) => theme.text2};
`

export default function SendHeader() {
  return (
    <StyledSendHeader>
      <RowBetween style={{ height: '35px' }}>
        <TYPE.black fontWeight={500}>Send</TYPE.black>
      </RowBetween>
    </StyledSendHeader>
  )
}
