import React from 'react'
import styled from 'styled-components'
import CurrencyLogo from '../CurrencyIcon'

const Wrapper = styled.div<{ margin: boolean; sizeraw: number }>`
  position: relative;
  display: flex;
  flex-direction: row;
  margin-right: ${({ sizeraw, margin }) => margin && (sizeraw / 3 + 8).toString() + 'px'};
`

interface DoubleAssetLogoProps {
  margin?: boolean
  size?: number
  logo0?: string
  logo1?: string
}

const HigherLogo = styled(CurrencyLogo)`
  z-index: 2;
`
const CoveredLogo = styled(CurrencyLogo)<{ sizeraw: number }>`
  position: absolute;
  left: ${({ sizeraw }) => '-' + (sizeraw / 2).toString() + 'px'} !important;
`

export default function DoubleAssetLogo({ logo0, logo1, size = 16, margin = false }: DoubleAssetLogoProps) {
  return (
    <Wrapper sizeraw={size} margin={margin}>
      {logo0 && <HigherLogo logo0={logo0} size={size.toString() + 'px'} />}
      {logo1 && <CoveredLogo logo0={logo1} size={size.toString() + 'px'} sizeraw={size} />}
    </Wrapper>
  )
}
