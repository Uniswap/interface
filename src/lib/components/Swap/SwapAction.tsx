import styled from 'lib/theme'
import TYPE from 'lib/theme/type'

import Row from '../Row'

export const EmptyRow = styled(Row)`
  border: 1px solid ${({ theme }) => theme.outline};
  border-radius: 0.5em;
  cursor: not-allowed;
  height: 3.5em;
`

export default function SwapAction() {
  return (
    <EmptyRow justify="center">
      <TYPE.buttonLarge>Enter amount</TYPE.buttonLarge>
    </EmptyRow>
  )
}
