import React from 'react'
import styled from 'styled-components'
import TokenLogo from '../TokenLogo'

export default function DoubleTokenLogo({ a0, a1, size = 16, margin = false }) {
  const TokenWrapper = styled.div`
    position: relative;
    display: flex;
    flex-direction: row;
    margin-right: ${({ sizeraw, margin }) => margin && (sizeraw / 3 + 8).toString() + 'px'};
  `

  const HigherLogo = styled(TokenLogo)`
    z-index: 2;
  `

  const CoveredLogo = styled(TokenLogo)`
    position: absolute;
    left: ${({ sizeraw }) => (sizeraw / 2).toString() + 'px'};
  `

  return (
    <TokenWrapper sizeraw={size} margin={margin}>
      <HigherLogo address={a0} size={size.toString() + 'px'} />
      <CoveredLogo address={a1} size={size.toString() + 'px'} sizeraw={size} />
    </TokenWrapper>
  )
}
