import { Trans } from '@lingui/macro'
import { ColumnCenter } from 'components/Column'
import { HelpCircle } from 'lib/icons'
import styled, { ThemedText } from 'lib/theme'

const HelpCircleIcon = styled(HelpCircle)`
  height: 64px;
  margin-bottom: 12px;
  stroke: ${({ theme }) => theme.secondary};
  width: 64px;
`

const Wrapper = styled(ColumnCenter)`
  flex-direction: column;
  height: 80%;
  justify-content: center;
  text-align: center;
`

export default function NoTokensAvailableOnNetwork() {
  return (
    <Wrapper>
      <HelpCircleIcon />
      <ThemedText.Body1 color="primary">
        <Trans>No tokens are available on this network. Please switch to another network.</Trans>
      </ThemedText.Body1>
    </Wrapper>
  )
}
