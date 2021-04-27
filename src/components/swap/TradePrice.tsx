import React from 'react'
import { Price } from '@uniswap/sdk-core'
import { useContext } from 'react'
import { Text } from 'rebass'

import { ThemeContext } from 'styled-components'
import { StyledBalanceMaxMini } from './styleds'
import Switch from '../../assets/svg/switch.svg'
import { ButtonEmpty } from '../Button'

interface TradePriceProps {
  price?: Price
  showInverted: boolean
  setShowInverted: (showInverted: boolean) => void
  showDetails: boolean
  setShowDetails: (showInverted: boolean) => void
}

export default function TradePrice({
  price,
  showInverted,
  setShowInverted,
  showDetails,
  setShowDetails,
}: TradePriceProps) {
  const theme = useContext(ThemeContext)

  const formattedPrice = showInverted ? price?.toSignificant(6) : price?.invert()?.toSignificant(6)

  const label = showInverted ? `${price?.quoteCurrency?.symbol}` : `${price?.baseCurrency?.symbol} `
  const labelInverted = showInverted ? `${price?.baseCurrency?.symbol} ` : `${price?.quoteCurrency?.symbol}`

  // ? `${price?.quoteCurrency?.symbol} per ${price?.baseCurrency?.symbol}`
  //   : `${price?.baseCurrency?.symbol} per ${price?.quoteCurrency?.symbol}`

  return (
    <div
      style={{
        justifyContent: 'space-between',
        alignItems: 'center',
        display: 'flex',
        width: '100%',
      }}
      onClick={() => setShowInverted(!showInverted)}
    >
      <ButtonEmpty style={{ padding: '0.25rem', width: 'fit-content' }} onClick={() => setShowDetails(!showDetails)}>
        <Text fontWeight={500} fontSize={14} color={theme.text2} style={{ marginRight: '.25rem' }}>
          Show Details
        </Text>
      </ButtonEmpty>

      <div style={{ alignItems: 'center', display: 'flex', width: 'fit-content' }}>
        <Text fontWeight={500} fontSize={14} color={theme.text2}>
          {'1 ' + labelInverted + ' = ' + formattedPrice ?? '-'} {label}
        </Text>
        <StyledBalanceMaxMini style={{ marginLeft: ' 0.5rem' }} onClick={() => setShowInverted(!showInverted)}>
          <img width={'16px'} src={Switch} alt="logo" />
        </StyledBalanceMaxMini>
      </div>
    </div>
  )
}
