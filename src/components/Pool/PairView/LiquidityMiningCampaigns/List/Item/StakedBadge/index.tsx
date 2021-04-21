import React from 'react'
import styled from 'styled-components'

const Root = styled.div`
  height: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(14, 159, 110, 0.1);
  border-radius: 4px;
  padding: 0 4px;
`

const Text = styled.div`
  font-weight: 600;
  font-size: 9px;
  line-height: 11px;
  letter-spacing: 0.02em;
  color: #0e9f6e;
`

export default function StakedBadge() {
  return (
    <Root>
      <Text>STAKING</Text>
    </Root>
  )
}
