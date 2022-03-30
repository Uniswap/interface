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

const Text = styled(ThemedText.Body1)`
  text-align: center;
`

const Wrapper = styled(ColumnCenter)`
  height: 80%;
  justify-content: center;
`

function NoTokensAvailableOnNetwork() {
  return (
    <Wrapper>
      <HelpCircleIcon />
      <Text color="primary">
        <Trans>No tokens are available on this network. Please switch to another network.</Trans>
      </Text>
    </Wrapper>
  )
}
export default NoTokensAvailableOnNetwork
