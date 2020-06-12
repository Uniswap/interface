import React from 'react'
import styled from 'styled-components'
import TokenLogo from '../TokenLogo'

const TokenWrapper = styled.div<{ margin: boolean; sizeraw: number }>`
  position: relative;
  display: flex;
  flex-direction: row;
  margin-right: ${({ sizeraw, margin }) => margin && (sizeraw / 3 + 8).toString() + 'px'};
`

interface DoubleTokenLogoProps {
  margin?: boolean
  size?: number
  a0: string
  a1?: string
}

const HigherLogo = styled(TokenLogo)`
  z-index: 2;
`
const CoveredLogo = styled(TokenLogo)<{ sizeraw: number }>`
  position: absolute;
  left: ${({ sizeraw }) => (sizeraw / 2).toString() + 'px'};
`

export default function DoubleTokenLogo({ a0, a1, size = 16, margin = false }: DoubleTokenLogoProps) {
  return (
    <TokenWrapper sizeraw={size} margin={margin}>
      <HigherLogo address={a0} size={size.toString() + 'px'} />
      {a1 && <CoveredLogo address={a1} size={size.toString() + 'px'} sizeraw={size} />}
    </TokenWrapper>
  )
}
