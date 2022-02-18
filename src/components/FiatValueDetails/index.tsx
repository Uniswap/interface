import React from 'react'
import styled from 'styled-components'
import { TYPE } from '../../theme'
import { CurrencyAmount, JSBI, Percent } from '@swapr/sdk'
import { warningFiatSeverity } from '../../utils/prices'

interface FiatValueDetailsProps {
  fiatValue?: CurrencyAmount | null
  priceImpact?: Percent
}

const PriceImpactText = styled.span<{ warning?: boolean }>`
  color: ${({ theme, warning }) => warning && theme.red1};
  margin-left: 8px;
`

export default function FiatValueDetails({ fiatValue, priceImpact }: FiatValueDetailsProps) {
  const fiatPriceImpactSeverity = warningFiatSeverity(priceImpact)

  return (
    <TYPE.body fontWeight="600" fontSize="11px" lineHeight="13px" letterSpacing="0.08em">
      <span>${fiatValue ? fiatValue.toFixed(2) : '0'}</span>
      {priceImpact && (
        <PriceImpactText warning={fiatPriceImpactSeverity === 1}>
          {priceImpact.multiply(JSBI.BigInt(-100)).toSignificant(3)}%
        </PriceImpactText>
      )}
    </TYPE.body>
  )
}
