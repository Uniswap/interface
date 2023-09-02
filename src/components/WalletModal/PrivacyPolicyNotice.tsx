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

const LAST_UPDATED_DATE = '6.7.23'

export default function PrivacyPolicyNotice() {
  return (
    <ThemedText.Caption color="textSecondary">
      <Trans>By connecting a wallet, you agree to Kinetix Finance&apos;</Trans>{' '}
      <StyledLink href="https://docs.google.com/document/d/1XhnspV89JVU637jNXBZK4JDcF_KTFgBsMoMh5RaU7rk/edit?usp=sharing">
        <Trans>Terms of Service</Trans>{' '}
      </StyledLink>
      <Trans>and consent to its</Trans>{' '}
      <StyledLink href="https://uniswap.org/privacy-policy">
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
