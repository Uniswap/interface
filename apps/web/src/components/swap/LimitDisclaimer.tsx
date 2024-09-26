import Column from 'components/deprecated/Column'
import styled from 'lib/styled-components'
import { ExternalLink, ThemedText } from 'theme/components'
import { Trans } from 'uniswap/src/i18n'

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
        <Trans i18nKey="pool.limitFluctuation.warning" />
      </DisclaimerText>
      <DisclaimerText>Canceling a limit has a network cost.</DisclaimerText>
      <DisclaimerText>
        <ExternalLink href="https://support.uniswap.org/hc/en-us/articles/24300813697933">
          <Trans i18nKey="common.button.learn" />
        </ExternalLink>
      </DisclaimerText>
    </Container>
  )
}
