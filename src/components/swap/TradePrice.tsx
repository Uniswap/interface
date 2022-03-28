import React from 'react'
import { Price } from '@swapr/sdk'
import { TYPE } from '../../theme'
import styled from 'styled-components'
import { transparentize } from 'polished'
import { RowFixed } from '../Row'
import { MouseoverTooltip } from '../Tooltip/index'

const Wrapper = styled(RowFixed)`
  background: ${props => transparentize(0.9, props.theme.bg4)};
  border-radius: 4px;
  padding: 4px 5px;
  cursor: pointer;
`

const StyledPriceText = styled(TYPE.body)`
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
`

interface TradePriceProps {
  price?: Price
  showInverted: boolean
  setShowInverted: (showInverted: boolean) => void
}

export default function TradePrice({ price, showInverted, setShowInverted }: TradePriceProps) {
  const formattedPrice = showInverted ? price?.toSignificant(6) : price?.invert()?.toSignificant(6)

  const show = Boolean(price?.baseCurrency && price?.quoteCurrency)
  const label = showInverted
    ? `${price?.quoteCurrency?.symbol} per ${price?.baseCurrency?.symbol}`
    : `${price?.baseCurrency?.symbol} per ${price?.quoteCurrency?.symbol}`

  return (
    <Wrapper onClick={() => setShowInverted(!showInverted)}>
      {show ? (
        <>
          <MouseoverTooltip content={formattedPrice} placement="top">
            <StyledPriceText mr="4px" fontSize="13px" lineHeight="12px" letterSpacing="0" fontWeight="700">
              {formattedPrice ?? '-'}
            </StyledPriceText>
          </MouseoverTooltip>
          <TYPE.body fontSize="13px" lineHeight="12px" letterSpacing="0" fontWeight="500">
            {label}
          </TYPE.body>
        </>
      ) : (
        '-'
      )}
    </Wrapper>
  )
}
