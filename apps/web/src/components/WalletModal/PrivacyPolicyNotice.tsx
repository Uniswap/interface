import { Trans } from 'i18n'
import styled from 'lib/styled-components'
import { ExternalLink, ThemedText } from 'theme/components'

const StyledLink = styled(ExternalLink)`
  font-weight: 535;
  color: ${({ theme }) => theme.neutral2};
`

export default function PrivacyPolicyNotice() {
  return (
    <ThemedText.BodySmall color="neutral2">
      <Trans i18nKey="wallet.connectingAgreement" />{' '}
      <StyledLink href="https://uniswap.org/terms-of-service/">
        <Trans i18nKey="common.termsOfService" />{' '}
      </StyledLink>
      <Trans i18nKey="wallet.termsAndConsent" />{' '}
      <StyledLink href="https://uniswap.org/privacy-policy">
        <Trans i18nKey="wallet.privacyPolicyPeriod" />
      </StyledLink>
    </ThemedText.BodySmall>
  )
}
