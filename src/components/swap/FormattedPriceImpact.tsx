import { Percent } from '@dynamic-amm/sdk'
import React from 'react'
import { ONE_BIPS } from '../../constants'
import { warningSeverity } from '../../utils/prices'
import { ErrorText } from './styleds'

/**
 * Formatted version of price impact text with warning colors
 */
export default function FormattedPriceImpact({ priceImpact }: { priceImpact?: Percent }) {
  if (!priceImpact || priceImpact.lessThan('0')) {
    return <div>--</div>
  }

  return (
    <ErrorText fontWeight={500} fontSize={14} severity={warningSeverity(priceImpact)}>
      {priceImpact.lessThan(ONE_BIPS) ? '<0.01%' : `${priceImpact.toFixed(2)}%`}
    </ErrorText>
  )
}
