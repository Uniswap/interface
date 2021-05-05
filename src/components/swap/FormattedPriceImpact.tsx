import { Percent } from '@uniswap/sdk-core'
import React from 'react'
import { ONE_BIPS } from '../../constants'
import { warningSeverity } from '../../utils/prices'
import { ErrorText, ErrorPill } from './styleds'

/**
 * Formatted version of price impact text with warning colors
 */
export default function FormattedPriceImpact({ priceImpact }: { priceImpact?: Percent }) {
  return (
    <ErrorText fontWeight={500} fontSize={12} severity={warningSeverity(priceImpact)}>
      {priceImpact
        ? priceImpact.lessThan(ONE_BIPS)
          ? `-${priceImpact.toFixed(2)}%`
          : `${priceImpact.toFixed(2)}%`
        : '-'}
    </ErrorText>
  )
}

export function SmallFormattedPriceImpact({ priceImpact }: { priceImpact?: Percent }) {
  return (
    <ErrorPill fontWeight={500} fontSize={12} severity={warningSeverity(priceImpact)}>
      {priceImpact
        ? priceImpact.lessThan(ONE_BIPS)
          ? `(-${priceImpact.toFixed(2)}%)`
          : `(-${priceImpact.toFixed(2)}%)`
        : '-'}
    </ErrorPill>
  )
}
