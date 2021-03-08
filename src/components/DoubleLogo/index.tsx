import { Currency } from 'dxswap-sdk'
import React from 'react'
import styled from 'styled-components'
import CurrencyLogo from '../CurrencyLogo'

const Wrapper = styled.div<{ sizeraw: number; marginRight: number; marginLeft: number }>`
  position: relative;
  display: flex;
  flex-direction: row;
  height: ${({ sizeraw }) => sizeraw}px;
  width: ${({ sizeraw }) => (sizeraw * 2 - sizeraw / 2).toString() + 'px'};
  margin-right: ${({ marginRight }) => marginRight}px;
  margin-left: ${({ marginLeft }) => marginLeft}px;
`

const HigherLogo = styled(CurrencyLogo)<{ sizeraw: number }>`
  z-index: 2;
  position: absolute;
  left: ${({ sizeraw }) => (sizeraw / 2).toString() + 'px'} !important;
`
const CoveredLogo = styled(CurrencyLogo)`
  position: absolute;
  left: 0;
`

interface DoubleCurrencyLogoProps {
  size?: number
  marginRight?: number
  marginLeft?: number
  currency0?: Currency
  currency1?: Currency
}

export default function DoubleCurrencyLogo({
  currency0,
  currency1,
  size = 16,
  marginRight = 0,
  marginLeft = 0
}: DoubleCurrencyLogoProps) {
  return (
    <Wrapper sizeraw={size} marginRight={marginRight} marginLeft={marginLeft}>
      {currency0 && <HigherLogo currency={currency0} size={size.toString() + 'px'} sizeraw={size} />}
      {currency1 && <CoveredLogo currency={currency1} size={size.toString() + 'px'} />}
    </Wrapper>
  )
}
