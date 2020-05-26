import { Percent } from '@uniswap/sdk'
import React from 'react'
import { ONE_BIPS } from '../../constants'
import { warningSeverity } from '../../utils/prices'
import { ErrorText } from './styleds'

export default function FormattedPriceImpact({ priceImpact }: { priceImpact?: Percent }) {
  return (
    <ErrorText fontWeight={500} fontSize={14} severity={warningSeverity(priceImpact)}>
      {priceImpact?.lessThan(ONE_BIPS) ? '<0.01%' : `${priceImpact?.toFixed(2)}%` ?? '-'}
    </ErrorText>
  )
}
