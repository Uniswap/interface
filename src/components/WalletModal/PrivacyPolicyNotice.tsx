import { Trans } from '@lingui/macro'
import styled from 'styled-components'
import { ExternalLink, ThemedText } from 'theme'

const StyledLink = styled(ExternalLink)`
  font-weight: 600;
  color: ${({ theme }) => theme.textSecondary};
`

const LastUpdatedText = styled.span`
  color: ${({ theme }) => theme.textTertiary};
`

const LAST_UPDATED_DATE = '2 Oct 23'

export default function PrivacyPolicyNotice() {
  return (
    <ThemedText.Caption color="textSecondary">
      <Trans>By connecting a wallet, you agree to RigoBlock&apos;s</Trans>{' '}
      <StyledLink href="https://rigoblock.com/legal">
        <Trans>Terms of Service</Trans>{' '}
      </StyledLink>
      <Trans>and consent to its</Trans>{' '}
      <StyledLink href="https://rigoblock.com/legal">
        <Trans>Privacy Policy.</Trans>
      </StyledLink>
      <LastUpdatedText>
        {' ('}
        <Trans>Last Updated</Trans>
        {` ${LAST_UPDATED_DATE})`}
      </LastUpdatedText>
    </ThemedText.Caption>
  )
}
