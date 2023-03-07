import { Percent } from '@kyberswap/ks-sdk-core'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ONE_BIPS } from 'constants/index'
import { warningSeverity } from 'utils/prices'

const ErrorText = styled(Text)<{ severity?: 0 | 1 | 2 | 3 | 4 }>`
  color: ${({ theme, severity }) =>
    severity === 3 || severity === 4
      ? theme.red1
      : severity === 2
      ? theme.yellow2
      : severity === 1
      ? theme.text
      : theme.green1};
`
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
