import { Percent } from '@swapr/sdk'
import React from 'react'
import styled from 'styled-components'

const Root = styled.div`
  background: ${props => props.theme.mainPurple};
  background-blend-mode: overlay, normal;
  border-radius: 4px;
  padding: 3px 5px;
`

const Text = styled.div`
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: ${props => props.theme.white};
  text-align: center;
  font-family: 'Fira Code';
  line-height: 9px;
`

interface ApyBadgeProps {
  apy: Percent
  upTo?: boolean
}

export default function ApyBadge({ apy, upTo }: ApyBadgeProps) {
  return (
    <Root>
      <Text>{`${upTo ? 'UP TO' : ''} ${apy.toFixed(2)}% APY`}</Text>
    </Root>
  )
}
