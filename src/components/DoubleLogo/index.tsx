import { Currency } from 'dxswap-sdk'
import { transparentize } from 'polished'
import React from 'react'
import styled from 'styled-components'
import CurrencyLogo from '../CurrencyLogo'

const Wrapper = styled.div<{ sizeraw: number; marginRight: number; marginLeft: number }>`
  position: relative;
  display: flex;
  justify-content: flex-end;
  flex-direction: row;
  height: ${({ sizeraw }) => sizeraw}px;
  width: ${({ sizeraw }) => (sizeraw * 2 - sizeraw / 2).toString() + 'px'};
  margin-right: ${({ marginRight }) => marginRight}px;
  margin-left: ${({ marginLeft }) => marginLeft}px;
`

interface DoubleCurrencyLogoProps {
  size?: number
  loading?: boolean
  marginRight?: number
  marginLeft?: number
  currency0?: Currency
  currency1?: Currency
}

const HigherLogo = styled(CurrencyLogo)<{ loading?: boolean }>`
  z-index: 2;
  box-shadow: ${props => (props.loading ? 'none' : `0px 0px 8px ${transparentize(0.9, props.theme.black)}`)};
`

const CoveredLogo = styled(CurrencyLogo)`
  position: absolute;
  left: 0 !important;
`

export default function DoubleCurrencyLogo({
  currency0,
  currency1,
  loading,
  size = 16,
  marginRight = 0,
  marginLeft = 0
}: DoubleCurrencyLogoProps) {
  return (
    <Wrapper sizeraw={size} marginRight={marginRight} marginLeft={marginLeft}>
      <CoveredLogo loading={loading} currency={currency0} size={size.toString() + 'px'} />
      <HigherLogo loading={loading} currency={currency1} size={size.toString() + 'px'} />
    </Wrapper>
  )
}
