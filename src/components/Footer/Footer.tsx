import React from 'react'
import styled from 'styled-components'
import { Text } from 'rebass'
import { ExternalLink } from '../../theme'

const Footer = styled.div<{ show: boolean }>`
  margin: 0 auto;
  text-align: center;
  padding: 1rem;
  bottom: 0;
  left: 0;
  width: 100%;
`

export default function StickyFooter() {
  return (
    <Footer show={true}>
      <Text fontSize={12} fontWeight={500} margin={'0 auto'}>
        Forked with ♡ from
        <ExternalLink href="https://app.uniswap.org/">
          <span style={{ marginLeft: '2px', color: '#FF007A' }}>Uniswap</span>
        </ExternalLink>
      </Text>
      <Text fontSize={12} fontWeight={500} margin={'0 auto'}>
        and powered by
        <ExternalLink href="https://www.anydot.dev/">
          <span style={{ marginLeft: '2px', color: '#1133db' }}>any.sender</span>
        </ExternalLink>
      </Text>
    </Footer>
  )
}
