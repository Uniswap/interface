import React from 'react'
import styled from 'styled-components'
import TokenLogo from '../TokenLogo'

export default function DoubleTokenLogo({ addressOne, addressTwo, size = '1rem' }) {
  const TokenWrapper = styled.div`
    display: flex;
    flex-direction: row;
  `

  const HigherLogo = styled(TokenLogo)`
    z-index: 2;
  `

  const CoveredLogo = styled(TokenLogo)`
    margin-left: -12px;
  `

  return (
    <TokenWrapper>
      <HigherLogo address={addressOne} size={size} />
      <CoveredLogo address={addressTwo} size={size} />
    </TokenWrapper>
  )
}
