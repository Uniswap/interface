import styled from 'lib/styled-components'
import { ExternalLink, ThemedText } from 'theme/components'
import { Trans } from 'uniswap/src/i18n'

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
          termsLink: <StyledLink href="https://rigoblock.com/legal" />,
          privacyLink: <StyledLink href="https://rigoblock.com/legal" />,
        }}
      />
    </ThemedText.BodySmall>
  )
}
