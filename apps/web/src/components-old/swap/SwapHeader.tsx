import styled from 'styled-components'
import { ThemedText } from 'theme/components'

import { RowBetween } from '../Row'

const StyledSwapHeader = styled.div`
  padding: 12px 1rem 0px 1.5rem;
  margin-bottom: -4px;
  width: 100%;
  max-width: 420px;
  color: ${({ theme }) => theme.text2};
`

export default function SwapHeader({
  title = 'Swap',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  hideSettings = false,
}: {
  title?: string
  hideSettings?: boolean
}) {
  return (
    <StyledSwapHeader>
      <RowBetween>
        <ThemedText.DeprecatedBlack my={2} fontWeight={500}>
          {title}
        </ThemedText.DeprecatedBlack>
      </RowBetween>
    </StyledSwapHeader>
  )
}
