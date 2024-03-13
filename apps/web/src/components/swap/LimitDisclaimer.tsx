import { Trans } from '@lingui/macro'
import Column from 'components/Column'
import styled from 'styled-components'
import { ExternalLink, ThemedText } from 'theme/components'

const Container = styled(Column)`
  background-color: ${({ theme }) => theme.surface2};
  border-radius: 12px;
  padding: 12px;
  margin-top: 12px;
`

const DisclaimerText = styled(ThemedText.LabelMicro)`
  line-height: 16px;
`

export function LimitDisclaimer({ className }: { className?: string }) {
  return (
    <Container gap="sm" className={className}>
      <DisclaimerText>
        <Trans>
          Please be aware that the execution for limits may vary based on real-time market fluctuations and Ethereum
          network congestion. Limits may not execute exactly when tokens reach the specified price.
        </Trans>
      </DisclaimerText>
      <DisclaimerText>Canceling a limit has a network cost.</DisclaimerText>
      <DisclaimerText>
        <ExternalLink href="https://support.uniswap.org/hc/en-us/articles/24300813697933">
          <Trans>Learn more</Trans>
        </ExternalLink>
      </DisclaimerText>
    </Container>
  )
}
