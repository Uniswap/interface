import styled from 'lib/theme'
import TYPE from 'lib/theme/type'

import Row from '../Row'

const ToolbarRow = styled(Row)`
  border-top: 1px solid ${({ theme }) => theme.outline};
  padding-top: 0.75em;
`

export default function SwapToolbar() {
  return (
    <ToolbarRow grow={true}>
      <TYPE.caption>Uniswap V3</TYPE.caption>
    </ToolbarRow>
  )
}
