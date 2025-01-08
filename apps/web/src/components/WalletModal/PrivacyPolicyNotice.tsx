import styled from 'lib/styled-components'
import { Trans } from 'react-i18next'
import { ExternalLink, ThemedText } from 'theme/components'

const StyledLink = styled(ExternalLink)`
  font-weight: 535;
  color: ${({ theme }) => theme.neutral2};
`

export default function PrivacyPolicyNotice() {
  return (
    <ThemedText.BodySmall color="neutral2">
      <Trans
        i18nKey="wallet.connectingAgreement"
        components={{
          termsLink: <StyledLink href="https://uniswap.org/terms-of-service/" />,
          privacyLink: <StyledLink href="https://uniswap.org/privacy-policy" />,
        }}
      />
    </ThemedText.BodySmall>
  )
}
