import { Trans } from '@lingui/macro'
import styled from 'styled-components/macro'
import { ExternalLink, ThemedText } from 'theme'

const StyledLink = styled(ExternalLink)`
  font-weight: 600;
  color: ${({ theme }) => theme.textSecondary};
`

export default function PrivacyPolicyNotice() {
  return (
    <ThemedText.Caption color="textSecondary">
      <Trans>By connecting a wallet, you agree to Pegasys Finance</Trans>{' '}
      <StyledLink href="https://pegasys.fi/terms-of-service">
        <Trans>Terms of Service</Trans>{' '}
      </StyledLink>
    </ThemedText.Caption>
  )
}
