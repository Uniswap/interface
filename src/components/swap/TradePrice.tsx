import React, { useCallback } from 'react'
import { Price } from '@uniswap/sdk-core'
import { useContext } from 'react'
import { Text } from 'rebass'

import styled, { ThemeContext } from 'styled-components'
import { StyledBalanceMaxMini } from './styleds'
import Switch from '../../assets/svg/switch.svg'

interface TradePriceProps {
  price: Price
  showInverted: boolean
  setShowInverted: (showInverted: boolean) => void
}

const StyledPriceContainer = styled.div`
  justify-content: flex-end;
  align-items: center;
  display: flex;
  width: 100%;
`

export default function TradePrice({ price, showInverted, setShowInverted }: TradePriceProps) {
  const theme = useContext(ThemeContext)

  let formattedPrice: string
  try {
    formattedPrice = showInverted ? price.toSignificant(6) : price.invert()?.toSignificant(6)
  } catch (error) {
    formattedPrice = '0'
  }

  const label = showInverted ? `${price.quoteCurrency?.symbol}` : `${price.baseCurrency?.symbol} `
  const labelInverted = showInverted ? `${price.baseCurrency?.symbol} ` : `${price.quoteCurrency?.symbol}`
  const flipPrice = useCallback(() => setShowInverted(!showInverted), [setShowInverted, showInverted])

  return (
    <StyledPriceContainer>
      <div style={{ alignItems: 'center', display: 'flex', width: 'fit-content' }}>
        <Text fontWeight={500} fontSize={14} color={theme.text2}>
          {'1 ' + labelInverted + ' = ' + formattedPrice ?? '-'} {label}
        </Text>
        <StyledBalanceMaxMini style={{ marginLeft: '0.5rem' }} onClick={flipPrice}>
          <img width={'16px'} src={Switch} alt="logo" />
        </StyledBalanceMaxMini>
      </div>
    </StyledPriceContainer>
  )
}
