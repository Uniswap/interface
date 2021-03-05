import { Currency } from 'dxswap-sdk'
import React from 'react'
import styled from 'styled-components'
import CurrencyLogo from '../CurrencyLogo'

const Wrapper = styled.div<{ margin: boolean; sizeraw: number }>`
  position: relative;
  display: flex;
  justify-content: flex-end;
  flex-direction: row;
  width: ${props => props.sizeraw * 2 - 8}px; // -8 enforces the overlapping of the icons by 8 pixels
  height: ${props => props.sizeraw}px;
  margin-right: ${({ sizeraw, margin }) => margin && (sizeraw / 3 + 8).toString() + 'px'};
`

interface DoubleCurrencyLogoProps {
  margin?: boolean
  size?: number
  loading?: boolean
  currency0?: Currency
  currency1?: Currency
}

const HigherLogo = styled(CurrencyLogo)`
  z-index: 2;
`

const CoveredLogo = styled(CurrencyLogo)<{ sizeraw: number }>`
  position: absolute;
  left: 0 !important;
`

export default function DoubleCurrencyLogo({
  currency0,
  currency1,
  loading,
  size = 16,
  margin = false
}: DoubleCurrencyLogoProps) {
  return (
    <Wrapper sizeraw={size} margin={margin}>
      <HigherLogo loading={loading} currency={currency0} size={size.toString() + 'px'} />
      <CoveredLogo loading={loading} currency={currency1} size={size.toString() + 'px'} sizeraw={size} />
    </Wrapper>
  )
}
